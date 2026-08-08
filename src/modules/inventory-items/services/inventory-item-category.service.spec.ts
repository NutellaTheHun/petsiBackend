import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CreateInventoryItemCategoryDto } from '../dto/inventory-item-category/create-inventory-item-category.dto';
import { UpdateInventoryItemCategoryDto } from '../dto/inventory-item-category/update-inventory-item-category.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { inventoryItemCategoryToUpdateDto } from '../utils/entity-transformers/inventory-item-category.dto.transformer';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemCategoryService } from './inventory-item-category.service';

class TestableInventoryItemCategoryService extends InventoryItemCategoryService {
    async createEntityForTest(
        dto: CreateInventoryItemCategoryDto,
        manager: EntityManager,
    ): Promise<InventoryItemCategory> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateInventoryItemCategoryDto,
        entity: InventoryItemCategory,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('Inventory Item Category Service', () => {
    let testingUtil: InventoryItemTestingUtil;
    let service: TestableInventoryItemCategoryService;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;
    let categoryRepo: Repository<InventoryItemCategory>;
    let tenantRepo: Repository<Tenant>;
    let requestContext: TestRequestContextService;

    let tenant: Tenant;
    let otherTenant: Tenant;
    let categories: InventoryItemCategory[];
    let otherTenantCategory: InventoryItemCategory;

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule({
            inventoryItemCategoryServiceClass: TestableInventoryItemCategoryService,
        });
        testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
        service = module.get<InventoryItemCategoryService>(
            InventoryItemCategoryService,
        ) as TestableInventoryItemCategoryService;
        dataSource = module.get(DataSource);
        categoryRepo = module.get(getRepositoryToken(InventoryItemCategory));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        requestContext = module.get(RequestContextService) as TestRequestContextService;

        tenant = await tenantRepo.save({ name: `${P}-tenant`, subdomain: `${P}-subdomain` });
        otherTenant = await tenantRepo.save({
            name: `${P}-other-tenant`,
            subdomain: `${P}-other-subdomain`,
        });
        requestContext.setContext({ tenantId: tenant.id });

        ({ categories } = await testingUtil.seedCategories(P, tenant.id));
        otherTenantCategory = await categoryRepo.save({
            name: `${P}-other-tenant-category`,
            tenantId: otherTenant.id,
        } as InventoryItemCategory);
    });

    afterAll(async () => {
        await categoryRepo.delete([...categories.map((c) => c.id), otherTenantCategory.id]);
        await tenantRepo.delete([tenant.id, otherTenant.id]);
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    describe('category lifecycle', () => {
        let created: InventoryItemCategory;

        it('should create category', async () => {
            const dto = plainToInstance(CreateInventoryItemCategoryDto, { name: `${P}-create-test` });
            await dataSource.transaction(async (manager) => {
                created = await service.createEntityForTest(dto, manager);
            });
            expect(created.id).toBeDefined();
            expect(created.name).toBe(dto.name);
        });

        it('should update category', async () => {
            const dto = plainToInstance(UpdateInventoryItemCategoryDto, { name: `${P}-updated` });
            await dataSource.transaction(async (manager) => {
                await service.updateEntityForTest(dto, created, manager);
            });
            const reloaded = await categoryRepo.findOneOrFail({ where: { id: created.id } });
            expect(reloaded.name).toBe(`${P}-updated`);
        });

        it('should remove category', async () => {
            await service.remove(created.id);
            await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException);
        });
    });

    it('should find seeded category in findAll results', async () => {
        const result = await service.findAll();
        const found = result.items.find((c) => c.id === categories[0].id);
        expect(found).toBeDefined();
    });

    it('should find one category with relations', async () => {
        const result = await service.findOne(categories[0].id, ['inventoryItems']);
        expect(result.id).toBe(categories[0].id);
        expect(Array.isArray(result.inventoryItems)).toBe(true);
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(service.findOne(9_999_999)).rejects.toThrow(NotFoundException);
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(InventoryItemCategoryService.prototype as any, 'updateEntity');
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when name unchanged', async () => {
            const cat = categories[0];
            const dto = inventoryItemCategoryToUpdateDto(cat);
            await service.update(cat.id, dto);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const cat = categories[1];
            const dto = inventoryItemCategoryToUpdateDto(cat, { name: `${P}-cat-renamed` });
            await service.update(cat.id, dto);
            expect(spy).toHaveBeenCalled();
            const row = await categoryRepo.findOneOrFail({ where: { id: cat.id } });
            expect(row.name).toBe(`${P}-cat-renamed`);
        });
    });

    describe('tenant scoping', () => {
        it('create stamps the caller tenant, not client input', async () => {
            const created = await service.create(
                plainToInstance(CreateInventoryItemCategoryDto, {
                    name: `${P}-tenant-stamped`,
                }),
            );
            expect((created as InventoryItemCategory).tenantId).toBe(tenant.id);
            await categoryRepo.delete(created.id);
        });

        it('findOne throws NotFoundException for an id belonging to a different tenant', async () => {
            await expect(service.findOne(otherTenantCategory.id)).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
