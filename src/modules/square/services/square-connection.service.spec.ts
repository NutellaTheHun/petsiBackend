import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SquareError } from 'square';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { LocationTestUtil } from '../../locations/utils/location-test.util';
import { OrderCategory } from '../../orders/entities/order-category.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { SquareClientFactory } from '../client/square-client.factory';
import {
    SquareReauthRequiredException,
    SquareUpstreamException,
} from '../client/square-error-boundary';
import { SquareConnection } from '../entities/square-connection.entity';
import { FakeSquareClientFactory } from '../utils/fake-square-client.factory';
import { getSquareTestingModule } from '../utils/square-testing.module';
import { SquareTestUtil } from '../utils/square-test.util';
import { SquareConnectionService } from './square-connection.service';

const P = `t${Date.now()}`;

describe('SquareConnection', () => {
    let module: TestingModule;
    let connectionRepo: Repository<SquareConnection>;
    let categoryRepo: Repository<OrderCategory>;
    let tenantRepo: Repository<Tenant>;
    let squareTestUtil: SquareTestUtil;
    let tenant: Tenant;
    let otherTenant: Tenant;
    let testCtx: DatabaseTestContext;
    let connectionService: SquareConnectionService;
    let fake: FakeSquareClientFactory;
    let requestContext: TestRequestContextService;

    beforeAll(async () => {
        module = await getSquareTestingModule();
        connectionRepo = module.get(getRepositoryToken(SquareConnection));
        categoryRepo = module.get(getRepositoryToken(OrderCategory));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        squareTestUtil = module.get(SquareTestUtil);
        connectionService = module.get(SquareConnectionService);
        fake = module.get(SquareClientFactory);
        requestContext = module.get(RequestContextService);
        const locationTestUtil = module.get(LocationTestUtil);
        tenant = await locationTestUtil.seedTenant(P);
        otherTenant = await locationTestUtil.seedTenant(`${P}-other`);
    });

    afterAll(async () => {
        await tenantRepo.delete([tenant.id, otherTenant.id]);
        await module.close();
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
        fake.reset();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    async function seed(
        tenantId: number,
        overrides: Partial<SquareConnection> = {},
    ) {
        const connection = await squareTestUtil.seedConnection(
            P,
            tenantId,
            overrides,
        );
        testCtx.addCleanupFunction(async () => {
            await connectionRepo.delete(connection.id);
        });
        return connection;
    }

    it('sets the default order category to null when the category is deleted', async () => {
        const category = await categoryRepo.save({
            tenantId: tenant.id,
            name: `${P}-Square`,
        });
        testCtx.addCleanupFunction(async () => {
            await categoryRepo.delete(category.id);
        });
        const connection = await seed(tenant.id, {
            defaultOrderCategoryId: category.id,
        });

        await categoryRepo.delete(category.id);

        const reloaded = await connectionRepo.findOneByOrFail({
            id: connection.id,
        });
        expect(reloaded.defaultOrderCategoryId).toBeNull();
    });

    it('allows one connection per tenant', async () => {
        await seed(tenant.id);
        await expect(
            squareTestUtil.seedConnection(`${P}-dup`, tenant.id),
        ).rejects.toThrow();
    });

    it('rejects a merchant already linked to another tenant', async () => {
        const first = await seed(tenant.id);
        await expect(
            squareTestUtil.seedConnection(P, otherTenant.id, {
                merchantId: first.merchantId,
            }),
        ).rejects.toThrow();
    });

    describe('callTenant', () => {
        it('sets needs_reauth when Square returns 401, and refuses later calls without calling Square', async () => {
            const connection = await seed(tenant.id);
            const list = jest.fn(() =>
                Promise.reject(
                    new SquareError({
                        statusCode: 401,
                        body: {
                            errors: [
                                {
                                    category: 'AUTHENTICATION_ERROR',
                                    code: 'UNAUTHORIZED',
                                    detail: `${P}-access-token`,
                                },
                            ],
                        },
                    }),
                ),
            );
            fake.tenantApi.locations.list = list;

            const err: unknown = await connectionService
                .callTenant(connection, (api) => api.locations.list())
                .catch((e: unknown) => e);

            expect(err).toBeInstanceOf(SquareReauthRequiredException);
            expect(
                JSON.stringify(
                    (err as SquareReauthRequiredException).getResponse(),
                ),
            ).not.toContain(`${P}-access-token`);
            expect((err as Error).message).not.toContain(`${P}-access-token`);
            const reloaded = await connectionRepo.findOneByOrFail({
                id: connection.id,
            });
            expect(reloaded.status).toBe('needs_reauth');

            await expect(
                connectionService.callTenant(reloaded, (api) =>
                    api.locations.list(),
                ),
            ).rejects.toBeInstanceOf(SquareReauthRequiredException);
            expect(list).toHaveBeenCalledTimes(1);
        });

        it('leaves the connection connected on other Square failures', async () => {
            const connection = await seed(tenant.id);
            fake.tenantApi.locations.list = () =>
                Promise.reject(new SquareError({ statusCode: 500 }));

            await expect(
                connectionService.callTenant(connection, (api) =>
                    api.locations.list(),
                ),
            ).rejects.toBeInstanceOf(SquareUpstreamException);
            expect(
                (await connectionRepo.findOneByOrFail({ id: connection.id }))
                    .status,
            ).toBe('connected');
        });

        it('does not revive a disconnected connection', async () => {
            const connection = await seed(tenant.id);
            await connectionService.markDisconnected(tenant.id);

            await connectionService.markNeedsReauth(connection);

            expect(
                (await connectionRepo.findOneByOrFail({ id: connection.id }))
                    .status,
            ).toBe('disconnected');
        });

        it('reports needs_reauth through the status endpoint', async () => {
            await seed(tenant.id, { status: 'needs_reauth' });
            requestContext.setContext({ tenantId: tenant.id });

            await expect(
                connectionService.getStatusForCurrentTenant(),
            ).resolves.toMatchObject({ status: 'needs_reauth' });
        });
    });
});
