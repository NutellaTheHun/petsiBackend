import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryItemVendorDto } from '../dto/inventory-item-vendor/create-inventory-item-vendor.dto';
import { UpdateInventoryItemVendorDto } from '../dto/inventory-item-vendor/update-inventory-item-vendor.dto';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { inventoryItemVendorToUpdateDto } from '../utils/entity-transformers/inventory-item-vendor.dto.transformer';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemVendorService } from './inventory-item-vendor.service';

class TestableInventoryItemVendorService extends InventoryItemVendorService {
    async createEntityForTest(
        dto: CreateInventoryItemVendorDto,
        manager: EntityManager,
    ): Promise<InventoryItemVendor> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateInventoryItemVendorDto,
        entity: InventoryItemVendor,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('Inventory Item Vendor Service', () => {
    let testingUtil: InventoryItemTestingUtil;
    let vendorService: TestableInventoryItemVendorService;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;
    let vendorRepo: Repository<InventoryItemVendor>;

    let vendors: InventoryItemVendor[];

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule({
            inventoryItemVendorServiceClass: TestableInventoryItemVendorService,
        });
        testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
        vendorService = module.get(
            InventoryItemVendorService,
        ) as TestableInventoryItemVendorService;
        dataSource = module.get(DataSource);
        vendorRepo = module.get(getRepositoryToken(InventoryItemVendor));

        ({ vendors } = await testingUtil.seedVendors(P));
    });

    afterAll(async () => {
        await vendorRepo.delete(vendors.map((v) => v.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    describe('vendor lifecycle', () => {
        let created: InventoryItemVendor;

        it('should create vendor', async () => {
            const dto = plainToInstance(CreateInventoryItemVendorDto, { name: `${P}-vendor-create` });
            await dataSource.transaction(async (manager) => {
                created = await vendorService.createEntityForTest(dto, manager);
            });
            expect(created.id).toBeDefined();
            expect(created.name).toBe(dto.name);
        });

        it('should update vendor', async () => {
            const dto = plainToInstance(UpdateInventoryItemVendorDto, { name: `${P}-vendor-updated` });
            await dataSource.transaction(async (manager) => {
                await vendorService.updateEntityForTest(dto, created, manager);
            });
            const reloaded = await vendorRepo.findOneOrFail({ where: { id: created.id } });
            expect(reloaded.name).toBe(`${P}-vendor-updated`);
        });

        it('should remove vendor', async () => {
            await vendorService.remove(created.id);
            await expect(vendorService.findOne(created.id)).rejects.toThrow(NotFoundException);
        });
    });

    it('should find seeded vendor in findAll results', async () => {
        const result = await vendorService.findAll();
        const found = result.items.find((v) => v.id === vendors[0].id);
        expect(found).toBeDefined();
    });

    it('should find one vendor with relations', async () => {
        const result = await vendorService.findOne(vendors[0].id, ['inventoryItems']);
        expect(result.id).toBe(vendors[0].id);
        expect(Array.isArray(result.inventoryItems)).toBe(true);
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(vendorService.findOne(9_999_999)).rejects.toThrow(NotFoundException);
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(InventoryItemVendorService.prototype as any, 'updateEntity');
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when name unchanged', async () => {
            const v = vendors[0];
            const dto = inventoryItemVendorToUpdateDto(v);
            await vendorService.update(v.id, dto);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const v = vendors[1];
            const dto = inventoryItemVendorToUpdateDto(v, { name: `${P}-vendor-renamed` });
            await vendorService.update(v.id, dto);
            expect(spy).toHaveBeenCalled();
            const row = await vendorRepo.findOneOrFail({ where: { id: v.id } });
            expect(row.name).toBe(`${P}-vendor-renamed`);
        });
    });
});
