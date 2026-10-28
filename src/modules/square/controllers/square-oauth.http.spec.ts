import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Square } from 'square';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { createHttpTestApp } from '../../../test/http-test-app';
import { TestUser } from '../../../test/test-user-guard';
import { LocationTestUtil } from '../../locations/utils/location-test.util';
import { OrderCategory } from '../../orders/entities/order-category.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { SquareClientFactory } from '../client/square-client.factory';
import { SquareConnection } from '../entities/square-connection.entity';
import { SquareOAuthState } from '../entities/square-oauth-state.entity';
import { SquareOAuthStateService } from '../services/square-oauth-state.service';
import { SquareTokenCryptoService } from '../services/square-token-crypto.service';
import { FakeSquareClientFactory } from '../utils/fake-square-client.factory';
import {
    SQUARE_TEST_CONFIG,
    getSquareTestingModule,
} from '../utils/square-testing.module';
import { SquareTestUtil } from '../utils/square-test.util';

const P = `t${Date.now()}`;

describe('square OAuth connect flow (HTTP)', () => {
    let app: INestApplication;
    let fake: FakeSquareClientFactory;
    let connectionRepo: Repository<SquareConnection>;
    let stateRepo: Repository<SquareOAuthState>;
    let categoryRepo: Repository<OrderCategory>;
    let tenantRepo: Repository<Tenant>;
    let stateService: SquareOAuthStateService;
    let tokenCrypto: SquareTokenCryptoService;
    let squareTestUtil: SquareTestUtil;
    let testCtx: DatabaseTestContext;

    let tenant: Tenant;
    let otherTenant: Tenant;
    let currentUser: TestUser | undefined;

    const merchantId = `${P}-merchant`;

    beforeAll(async () => {
        const module: TestingModule = await getSquareTestingModule();
        fake = module.get(SquareClientFactory);
        connectionRepo = module.get(getRepositoryToken(SquareConnection));
        stateRepo = module.get(getRepositoryToken(SquareOAuthState));
        categoryRepo = module.get(getRepositoryToken(OrderCategory));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        stateService = module.get(SquareOAuthStateService);
        tokenCrypto = module.get(SquareTokenCryptoService);
        squareTestUtil = module.get(SquareTestUtil);

        const locationTestUtil = module.get(LocationTestUtil);
        tenant = await locationTestUtil.seedTenant(P);
        otherTenant = await locationTestUtil.seedTenant(`${P}-other`);

        ({ app } = await createHttpTestApp(module, {
            user: () => currentUser,
        }));
    });

    afterAll(async () => {
        await stateRepo.delete({ tenantId: tenant.id });
        await tenantRepo.delete([tenant.id, otherTenant.id]);
        await app.close();
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
        fake.reset();
        currentUser = {
            tenantId: tenant.id,
            isTenantAdmin: true,
            locations: [],
        };
        testCtx.addCleanupFunction(async () => {
            await connectionRepo.delete({ tenantId: tenant.id });
        });
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    function stubSquare(merchant = merchantId) {
        const obtainToken = jest.fn(
            (): Promise<Square.ObtainTokenResponse> =>
                Promise.resolve({
                    accessToken: `${P}-access`,
                    refreshToken: `${P}-refresh`,
                    expiresAt: '2026-11-27T00:00:00Z',
                    merchantId: merchant,
                    tokenType: 'bearer',
                }),
        );
        const getMerchant = jest.fn(
            (): Promise<Square.GetMerchantResponse> =>
                Promise.resolve({
                    merchant: {
                        id: merchant,
                        businessName: `${P} Bakery`,
                        country: 'US',
                    },
                }),
        );
        const revokeToken = jest.fn(
            (): Promise<Square.RevokeTokenResponse> =>
                Promise.resolve({ success: true }),
        );
        fake.appApi.oAuth.obtainToken = obtainToken;
        fake.appApi.oAuth.revokeToken = revokeToken;
        fake.tenantApi.merchants.get = getMerchant;
        return { obtainToken, getMerchant, revokeToken };
    }

    async function startState(): Promise<string> {
        const res = await request(app.getHttpServer()).post(
            '/square/connection/authorize',
        );
        expect(res.status).toBe(200);
        const url = new URL(
            (res.body as { authorizeUrl: string }).authorizeUrl,
        );
        const state = url.searchParams.get('state');
        expect(state).toBeTruthy();
        return state as string;
    }

    function callback(query: Record<string, string>) {
        return request(app.getHttpServer())
            .get('/square/oauth/callback')
            .query(query);
    }

    function expectOutcome(res: request.Response, outcome: string) {
        expect(res.status).toBe(302);
        const location = new URL(res.headers.location);
        expect(`${location.origin}${location.pathname}`).toBe(
            SQUARE_TEST_CONFIG.settingsUrl,
        );
        expect(location.searchParams.get('square')).toBe(outcome);
    }

    const findConnection = () =>
        connectionRepo.findOne({ where: { tenantId: tenant.id } });

    describe('start', () => {
        it('returns the Sandbox authorize URL with only the read scopes', async () => {
            const res = await request(app.getHttpServer()).post(
                '/square/connection/authorize',
            );
            expect(res.status).toBe(200);
            const raw = (res.body as { authorizeUrl: string }).authorizeUrl;
            const url = new URL(raw);
            expect(url.origin).toBe('https://connect.squareupsandbox.com');
            expect(url.pathname).toBe('/oauth2/authorize');
            expect(url.searchParams.get('client_id')).toBe(
                SQUARE_TEST_CONFIG.applicationId,
            );
            expect(raw).toContain(
                'scope=ORDERS_READ+ITEMS_READ+MERCHANT_PROFILE_READ',
            );
            expect(url.searchParams.has('session')).toBe(false);
        });
    });

    describe('callback', () => {
        it('stores a connected connection with encrypted tokens and the business name', async () => {
            const { obtainToken } = stubSquare();
            const state = await startState();

            currentUser = undefined; // Square's redirect carries no Bearer token
            const res = await callback({ code: 'auth-code', state });
            expectOutcome(res, 'connected');

            expect(obtainToken).toHaveBeenCalledWith(
                expect.objectContaining({
                    clientId: SQUARE_TEST_CONFIG.applicationId,
                    code: 'auth-code',
                    redirectUri: SQUARE_TEST_CONFIG.oauthRedirectUrl,
                    grantType: 'authorization_code',
                }),
            );
            const connection = await findConnection();
            expect(connection).toMatchObject({
                status: 'connected',
                merchantId,
                businessName: `${P} Bakery`,
                scopes: ['ORDERS_READ', 'ITEMS_READ', 'MERCHANT_PROFILE_READ'],
            });
            expect(connection?.accessToken).not.toBe(`${P}-access`);
            expect(connection?.refreshToken).not.toBe(`${P}-refresh`);
            expect(tokenCrypto.decrypt(connection!.accessToken!)).toBe(
                `${P}-access`,
            );
            expect(tokenCrypto.decrypt(connection!.refreshToken!)).toBe(
                `${P}-refresh`,
            );
            expect(connection?.accessTokenExpiresAt?.toISOString()).toBe(
                '2026-11-27T00:00:00.000Z',
            );
            // The merchant profile was fetched with the new token
            expect(fake.tenantAccessTokens).toEqual([`${P}-access`]);
        });

        it('rejects a replayed state', async () => {
            const { obtainToken } = stubSquare();
            const state = await startState();
            expectOutcome(await callback({ code: 'c', state }), 'connected');
            await connectionRepo.delete({ tenantId: tenant.id });

            const replay = await callback({ code: 'c', state });
            expectOutcome(replay, 'invalid_state');
            expect(obtainToken).toHaveBeenCalledTimes(1);
            expect(await findConnection()).toBeNull();
        });

        it('rejects a tampered state', async () => {
            const { obtainToken } = stubSquare();
            const state = await startState();
            const [header, payload, signature] = state.split('.');
            const forged = Buffer.from(
                JSON.stringify({
                    ...(JSON.parse(
                        Buffer.from(payload, 'base64url').toString(),
                    ) as object),
                    tid: otherTenant.id,
                }),
            ).toString('base64url');

            const res = await callback({
                code: 'c',
                state: `${header}.${forged}.${signature}`,
            });
            expectOutcome(res, 'invalid_state');
            expect(obtainToken).not.toHaveBeenCalled();
            expect(await findConnection()).toBeNull();
            expect(
                await connectionRepo.findOne({
                    where: { tenantId: otherTenant.id },
                }),
            ).toBeNull();
        });

        it('rejects an expired state', async () => {
            const { obtainToken } = stubSquare();
            const state = await stateService.issue(tenant.id, null, -60);

            const res = await callback({ code: 'c', state });
            expectOutcome(res, 'invalid_state');
            expect(obtainToken).not.toHaveBeenCalled();
            expect(await findConnection()).toBeNull();
        });

        it('rejects a missing state', async () => {
            const { obtainToken } = stubSquare();
            expectOutcome(await callback({ code: 'c' }), 'invalid_state');
            expect(obtainToken).not.toHaveBeenCalled();
        });

        it('stores nothing when the seller declines', async () => {
            const { obtainToken } = stubSquare();
            const state = await startState();

            const res = await callback({
                error: 'access_denied',
                error_description: 'user_denied',
                state,
            });
            expectOutcome(res, 'declined');
            expect(obtainToken).not.toHaveBeenCalled();
            expect(await findConnection()).toBeNull();
            // The declined state can't be used afterwards
            expectOutcome(
                await callback({ code: 'c', state }),
                'invalid_state',
            );
        });

        it('rejects a merchant already linked to another tenant', async () => {
            const other = await squareTestUtil.seedConnection(
                P,
                otherTenant.id,
                { merchantId },
            );
            testCtx.addCleanupFunction(async () => {
                await connectionRepo.delete(other.id);
            });
            const { revokeToken } = stubSquare();
            const state = await startState();

            const res = await callback({ code: 'c', state });
            expectOutcome(res, 'merchant_in_use');
            expect(await findConnection()).toBeNull();
            // Revoking would also cut off the other tenant
            expect(revokeToken).not.toHaveBeenCalled();
            const otherReloaded = await connectionRepo.findOneByOrFail({
                id: other.id,
            });
            expect(otherReloaded.status).toBe('connected');
        });
    });

    describe('default order category', () => {
        it('pre-selects the tenant\'s "Square" category, matched case-insensitively', async () => {
            const category = await categoryRepo.save({
                tenantId: tenant.id,
                name: 'square',
            });
            testCtx.addCleanupFunction(async () => {
                await categoryRepo.delete(category.id);
            });
            stubSquare();
            const state = await startState();

            expectOutcome(await callback({ code: 'c', state }), 'connected');
            expect((await findConnection())?.defaultOrderCategoryId).toBe(
                category.id,
            );
        });

        it('leaves it empty when no "Square" category exists, and creates none', async () => {
            stubSquare();
            const state = await startState();

            expectOutcome(await callback({ code: 'c', state }), 'connected');
            expect((await findConnection())?.defaultOrderCategoryId).toBeNull();
            expect(
                await categoryRepo.count({ where: { tenantId: tenant.id } }),
            ).toBe(0);
        });

        it('lets an admin set and clear it', async () => {
            await squareTestUtil.seedConnection(P, tenant.id);
            const category = await categoryRepo.save({
                tenantId: tenant.id,
                name: `${P}-online`,
            });
            testCtx.addCleanupFunction(async () => {
                await categoryRepo.delete(category.id);
            });

            const set = await request(app.getHttpServer())
                .patch('/square/connection/default-category')
                .send({ orderCategoryId: category.id });
            expect(set.status).toBe(200);
            expect(set.body).toMatchObject({
                defaultOrderCategoryId: category.id,
            });

            const cleared = await request(app.getHttpServer())
                .patch('/square/connection/default-category')
                .send({ orderCategoryId: null });
            expect(cleared.status).toBe(200);
            expect((await findConnection())?.defaultOrderCategoryId).toBeNull();
        });

        it("rejects another tenant's category", async () => {
            await squareTestUtil.seedConnection(P, tenant.id);
            const foreign = await categoryRepo.save({
                tenantId: otherTenant.id,
                name: `${P}-foreign`,
            });
            testCtx.addCleanupFunction(async () => {
                await categoryRepo.delete(foreign.id);
            });

            const res = await request(app.getHttpServer())
                .patch('/square/connection/default-category')
                .send({ orderCategoryId: foreign.id });
            expect(res.status).toBe(400);
            expect(res.body).toMatchObject({ code: 'VALIDATION_ERROR' });
            expect((await findConnection())?.defaultOrderCategoryId).toBeNull();
        });
    });

    describe('disconnect and reconnect', () => {
        it('revokes, sets disconnected and wipes tokens; reconnecting reuses the row', async () => {
            const { revokeToken } = stubSquare();
            expectOutcome(
                await callback({ code: 'c', state: await startState() }),
                'connected',
            );
            const connected = await findConnection();

            const res = await request(app.getHttpServer()).delete(
                '/square/connection',
            );
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({ status: 'disconnected' });
            expect(revokeToken).toHaveBeenCalledWith(
                {
                    clientId: SQUARE_TEST_CONFIG.applicationId,
                    merchantId,
                },
                {
                    headers: {
                        Authorization: expect.stringMatching(
                            /^Client .+/,
                        ) as unknown,
                    },
                },
            );
            const disconnected = await findConnection();
            expect(disconnected).toMatchObject({
                id: connected?.id,
                status: 'disconnected',
                accessToken: null,
                refreshToken: null,
                merchantId,
            });

            expectOutcome(
                await callback({ code: 'c2', state: await startState() }),
                'connected',
            );
            const reconnected = await findConnection();
            expect(reconnected?.id).toBe(connected?.id);
            expect(reconnected?.status).toBe('connected');
        });

        it('keeps a chosen default category across a reconnect', async () => {
            const category = await categoryRepo.save({
                tenantId: tenant.id,
                name: `${P}-kept`,
            });
            testCtx.addCleanupFunction(async () => {
                await categoryRepo.delete(category.id);
            });
            await squareTestUtil.seedConnection(P, tenant.id, {
                merchantId,
                status: 'disconnected',
                accessToken: null,
                refreshToken: null,
                defaultOrderCategoryId: category.id,
            });
            stubSquare();

            expectOutcome(
                await callback({ code: 'c', state: await startState() }),
                'connected',
            );
            expect((await findConnection())?.defaultOrderCategoryId).toBe(
                category.id,
            );
        });

        it('reports needs_reauth, and reconnecting sets it back to connected with new tokens', async () => {
            const stale = await squareTestUtil.seedConnection(P, tenant.id, {
                merchantId,
                status: 'needs_reauth',
            });
            stubSquare();

            const status = await request(app.getHttpServer()).get(
                '/square/connection',
            );
            expect(status.status).toBe(200);
            expect(status.body).toMatchObject({ status: 'needs_reauth' });

            expectOutcome(
                await callback({ code: 'c', state: await startState() }),
                'connected',
            );
            const reconnected = await findConnection();
            expect(reconnected?.id).toBe(stale.id);
            expect(reconnected?.status).toBe('connected');
            expect(
                tokenCrypto.decrypt(reconnected?.accessToken as string),
            ).toBe(`${P}-access`);
        });

        it('does not call Square when already disconnected', async () => {
            await squareTestUtil.seedConnection(P, tenant.id, {
                status: 'disconnected',
                accessToken: null,
                refreshToken: null,
            });
            const { revokeToken } = stubSquare();

            const res = await request(app.getHttpServer()).delete(
                '/square/connection',
            );
            expect(res.status).toBe(200);
            expect(revokeToken).not.toHaveBeenCalled();
        });

        it('returns 409 SQUARE_NOT_CONNECTED with no connection', async () => {
            const res = await request(app.getHttpServer()).delete(
                '/square/connection',
            );
            expect(res.status).toBe(409);
            expect(res.body).toMatchObject({ code: 'SQUARE_NOT_CONNECTED' });
        });
    });
});
