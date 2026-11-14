import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { LocationTestUtil } from '../../locations/utils/location-test.util';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { SquareConnection } from '../entities/square-connection.entity';
import { FakeSquareClientFactory } from '../utils/fake-square-client.factory';
import { getSquareTestingModule } from '../utils/square-testing.module';
import { SquareTestUtil } from '../utils/square-test.util';
import { SquareClientFactory } from './square-client.factory';
import {
    SquareNotConnectedException,
    SquareReauthRequiredException,
} from './square-error-boundary';

const P = `t${Date.now()}`;

describe('SquareClientFactory (faked at client construction)', () => {
    let module: TestingModule;
    let factory: FakeSquareClientFactory;
    let connectionRepo: Repository<SquareConnection>;
    let tenantRepo: Repository<Tenant>;
    let squareTestUtil: SquareTestUtil;
    let tenant: Tenant;
    let testCtx: DatabaseTestContext;

    beforeAll(async () => {
        module = await getSquareTestingModule();
        factory = module.get(SquareClientFactory);
        connectionRepo = module.get(getRepositoryToken(SquareConnection));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        squareTestUtil = module.get(SquareTestUtil);
        tenant = await module.get(LocationTestUtil).seedTenant(P);
    });

    afterAll(async () => {
        await tenantRepo.delete(tenant.id);
        await module.close();
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
        factory.reset();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    async function seed(overrides: Partial<SquareConnection> = {}) {
        const connection = await squareTestUtil.seedConnection(
            P,
            tenant.id,
            overrides,
        );
        testCtx.addCleanupFunction(async () => {
            await connectionRepo.delete(connection.id);
        });
        return connection;
    }

    it('is overridden by the fake in the testing module', () => {
        expect(factory).toBeInstanceOf(FakeSquareClientFactory);
    });

    it('stores tokens encrypted and decrypts them to build the tenant client', async () => {
        const seeded = await seed();
        const stored = await connectionRepo.findOneByOrFail({ id: seeded.id });

        expect(stored.accessToken).not.toBe(`${P}-access-token`);
        expect(stored.accessToken).not.toContain(`${P}-access-token`);
        expect(stored.refreshToken).not.toContain(`${P}-refresh-token`);

        factory.tenantApi.merchants.get = () =>
            Promise.resolve({
                merchant: {
                    id: stored.merchantId,
                    businessName: 'Fixture',
                    country: 'US',
                },
            });
        const api = factory.forConnection(stored);
        const res = await api.merchants.get({ merchantId: 'me' });

        expect(res.merchant?.businessName).toBe('Fixture');
        expect(factory.tenantAccessTokens).toEqual([`${P}-access-token`]);
    });

    it('refuses a connection that needs re-authorization', async () => {
        const connection = await seed({ status: 'needs_reauth' });
        expect(() => factory.forConnection(connection)).toThrow(
            SquareReauthRequiredException,
        );
    });

    it('refuses a disconnected connection', async () => {
        const connection = await seed({
            status: 'disconnected',
            accessToken: null,
            refreshToken: null,
        });
        expect(() => factory.forConnection(connection)).toThrow(
            SquareNotConnectedException,
        );
        expect(factory.tenantAccessTokens).toEqual([]);
    });

    it('rejects unstubbed calls instead of reaching Square', async () => {
        const api = factory.forConnection(await seed());
        await expect(api.orders.get({ orderId: 'x' })).rejects.toThrow(
            'not stubbed',
        );
    });
});
