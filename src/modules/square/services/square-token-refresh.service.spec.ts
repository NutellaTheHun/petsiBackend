import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Square, SquareError } from 'square';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { LocationTestUtil } from '../../locations/utils/location-test.util';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { SquareClientFactory } from '../client/square-client.factory';
import { SquareConnection } from '../entities/square-connection.entity';
import { FakeSquareClientFactory } from '../utils/fake-square-client.factory';
import {
    SQUARE_TEST_CONFIG,
    getSquareTestingModule,
} from '../utils/square-testing.module';
import { SquareTestUtil } from '../utils/square-test.util';
import { SquareTokenCryptoService } from './square-token-crypto.service';
import { SquareTokenRefreshService } from './square-token-refresh.service';

const P = `t${Date.now()}`;
const DAY = 86_400_000;

function squareError(statusCode: number, code: string, detail: string) {
    return new SquareError({
        statusCode,
        body: { errors: [{ category: 'AUTHENTICATION_ERROR', code, detail }] },
    });
}

describe('SquareTokenRefreshService', () => {
    let module: TestingModule;
    let service: SquareTokenRefreshService;
    let fake: FakeSquareClientFactory;
    let connectionRepo: Repository<SquareConnection>;
    let tenantRepo: Repository<Tenant>;
    let tokenCrypto: SquareTokenCryptoService;
    let squareTestUtil: SquareTestUtil;
    let tenantA: Tenant;
    let tenantB: Tenant;
    let testCtx: DatabaseTestContext;

    beforeAll(async () => {
        module = await getSquareTestingModule();
        service = module.get(SquareTokenRefreshService);
        fake = module.get(SquareClientFactory);
        connectionRepo = module.get(getRepositoryToken(SquareConnection));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        tokenCrypto = module.get(SquareTokenCryptoService);
        squareTestUtil = module.get(SquareTestUtil);
        const locationTestUtil = module.get(LocationTestUtil);
        tenantA = await locationTestUtil.seedTenant(`${P}-a`);
        tenantB = await locationTestUtil.seedTenant(`${P}-b`);
    });

    afterAll(async () => {
        await tenantRepo.delete([tenantA.id, tenantB.id]);
        await module.close();
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
        fake.reset();
    });

    afterEach(async () => {
        jest.restoreAllMocks();
        await testCtx.executeCleanupFunctions();
    });

    /** Tokens are `${prefix}-access-token` / `${prefix}-refresh-token`. */
    async function seed(
        prefix: string,
        tenantId: number,
        expiresInDays: number,
    ) {
        const connection = await squareTestUtil.seedConnection(
            prefix,
            tenantId,
            {
                accessTokenExpiresAt: new Date(
                    Date.now() + expiresInDays * DAY,
                ),
            },
        );
        testCtx.addCleanupFunction(async () => {
            await connectionRepo.delete(connection.id);
        });
        return connection;
    }

    /**
     * Refreshing `${prefix}-refresh-token` returns `${prefix}-new-access`.
     * Prefixes in `failures` reject with that error instead. Other tenants'
     * leftover connections in the test DB get a rejection too.
     */
    function stubObtainToken(failures: Record<string, Error> = {}) {
        const obtainToken = jest.fn(
            (
                req: Square.ObtainTokenRequest,
            ): Promise<Square.ObtainTokenResponse> => {
                const prefix = req.refreshToken?.replace(/-refresh-token$/, '');
                if (!prefix?.startsWith(P)) {
                    return Promise.reject(new Error('not this spec'));
                }
                if (prefix in failures) {
                    return Promise.reject(failures[prefix]);
                }
                return Promise.resolve({
                    accessToken: `${prefix}-new-access`,
                    expiresAt: '2030-01-01T00:00:00Z',
                    merchantId: `${prefix}-merchant`,
                    tokenType: 'bearer',
                });
            },
        );
        fake.appApi.oAuth.obtainToken = obtainToken;
        return obtainToken;
    }

    const reload = (connection: SquareConnection) =>
        connectionRepo.findOneByOrFail({ id: connection.id });

    it('refreshes a connection expiring within 7 days and leaves a later one alone', async () => {
        const soon = await seed(`${P}-soon`, tenantA.id, 3);
        const later = await seed(`${P}-later`, tenantB.id, 20);
        const obtainToken = stubObtainToken();

        const result = await service.refreshExpiring();

        expect(result.refreshed).toContain(tenantA.id);
        expect(result.refreshed).not.toContain(tenantB.id);
        expect(obtainToken).toHaveBeenCalledWith({
            clientId: SQUARE_TEST_CONFIG.applicationId,
            clientSecret: expect.any(String) as unknown,
            refreshToken: `${P}-soon-refresh-token`,
            grantType: 'refresh_token',
        });

        const refreshed = await reload(soon);
        expect(refreshed.status).toBe('connected');
        expect(refreshed.accessToken).not.toBe(`${P}-soon-new-access`);
        expect(tokenCrypto.decrypt(refreshed.accessToken as string)).toBe(
            `${P}-soon-new-access`,
        );
        expect(refreshed.accessTokenExpiresAt).toEqual(
            new Date('2030-01-01T00:00:00Z'),
        );
        // No new refresh token in the response: the stored one is kept
        expect(tokenCrypto.decrypt(refreshed.refreshToken as string)).toBe(
            `${P}-soon-refresh-token`,
        );

        const untouched = await reload(later);
        expect(untouched.accessToken).toBe(later.accessToken);
        expect(untouched.accessTokenExpiresAt).toEqual(
            later.accessTokenExpiresAt,
        );
    });

    it('refreshes an already-expired token and stores a rotated refresh token', async () => {
        const expired = await seed(`${P}-expired`, tenantA.id, -2);
        fake.appApi.oAuth.obtainToken = () =>
            Promise.resolve({
                accessToken: `${P}-rotated-access`,
                refreshToken: `${P}-rotated-refresh`,
                expiresAt: '2030-01-01T00:00:00Z',
            });

        await service.refreshExpiring();

        const reloaded = await reload(expired);
        expect(tokenCrypto.decrypt(reloaded.refreshToken as string)).toBe(
            `${P}-rotated-refresh`,
        );
    });

    it('sets needs_reauth on a 401 while another tenant still refreshes', async () => {
        const failing = await seed(`${P}-revoked`, tenantA.id, 1);
        const ok = await seed(`${P}-ok`, tenantB.id, 1);
        stubObtainToken({
            [`${P}-revoked`]: squareError(401, 'UNAUTHORIZED', 'revoked'),
        });

        const result = await service.refreshExpiring();

        expect(result.needsReauth).toContain(tenantA.id);
        expect(result.refreshed).toContain(tenantB.id);
        const failed = await reload(failing);
        expect(failed.status).toBe('needs_reauth');
        expect(failed.accessToken).toBe(failing.accessToken);
        expect(
            tokenCrypto.decrypt((await reload(ok)).accessToken as string),
        ).toBe(`${P}-ok-new-access`);
    });

    it('sets needs_reauth on a 400 invalid_grant', async () => {
        const failing = await seed(`${P}-grant`, tenantA.id, 1);
        stubObtainToken({
            [`${P}-grant`]: squareError(400, 'invalid_grant', 'bad grant'),
        });

        await service.refreshExpiring();

        expect((await reload(failing)).status).toBe('needs_reauth');
    });

    it('leaves the connection connected on a transient failure and logs no tokens or details', async () => {
        const warn = jest.spyOn(PinoLogger.prototype, 'warn');
        const connection = await seed(`${P}-flaky`, tenantA.id, 1);
        stubObtainToken({
            [`${P}-flaky`]: squareError(
                503,
                'SERVICE_UNAVAILABLE',
                `${P}-flaky-refresh-token`,
            ),
        });

        const result = await service.refreshExpiring();

        expect(result.failed).toContain(tenantA.id);
        const reloaded = await reload(connection);
        expect(reloaded.status).toBe('connected');
        expect(reloaded.accessToken).toBe(connection.accessToken);

        const logged = JSON.stringify(
            warn.mock.calls.filter(
                ([obj]) =>
                    (obj as { tenantId?: number }).tenantId === tenantA.id,
            ),
        );
        expect(logged).toContain('SERVICE_UNAVAILABLE');
        expect(logged).not.toContain(`${P}-flaky-refresh-token`);
        expect(logged).not.toContain(`${P}-flaky-access-token`);
        expect(logged).not.toContain(connection.refreshToken as string);
    });

    it('skips connections that are not connected', async () => {
        const connection = await squareTestUtil.seedConnection(
            `${P}-reauth`,
            tenantA.id,
            {
                status: 'needs_reauth',
                accessTokenExpiresAt: new Date(Date.now() + DAY),
            },
        );
        testCtx.addCleanupFunction(async () => {
            await connectionRepo.delete(connection.id);
        });
        const obtainToken = stubObtainToken();

        await service.refreshExpiring();

        expect(obtainToken).not.toHaveBeenCalledWith(
            expect.objectContaining({
                refreshToken: `${P}-reauth-refresh-token`,
            }),
        );
        expect((await reload(connection)).status).toBe('needs_reauth');
    });
});
