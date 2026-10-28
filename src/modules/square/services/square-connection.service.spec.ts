import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { LocationTestUtil } from '../../locations/utils/location-test.util';
import { OrderCategory } from '../../orders/entities/order-category.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { SquareConnection } from '../entities/square-connection.entity';
import { getSquareTestingModule } from '../utils/square-testing.module';
import { SquareTestUtil } from '../utils/square-test.util';

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

    beforeAll(async () => {
        module = await getSquareTestingModule();
        connectionRepo = module.get(getRepositoryToken(SquareConnection));
        categoryRepo = module.get(getRepositoryToken(OrderCategory));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        squareTestUtil = module.get(SquareTestUtil);
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
});
