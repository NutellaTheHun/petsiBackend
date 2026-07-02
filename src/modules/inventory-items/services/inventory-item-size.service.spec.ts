import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryItemSizeDto } from '../dto/inventory-item-size/create-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../dto/inventory-item-size/update-inventory-item-size.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemSizeService } from './inventory-item-size.service';

class TestableInventoryItemSizeService extends InventoryItemSizeService {
    async createEntityForTest(
        dto: CreateInventoryItemSizeDto,
        manager: EntityManager,
    ): Promise<InventoryItemSize> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateInventoryItemSizeDto,
        entity: InventoryItemSize,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('Inventory Item Size Service', () => {
    let testingUtil: InventoryItemTestingUtil;
    let sizeService: TestableInventoryItemSizeService;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;

    let packageRepo: Repository<InventoryItemPackage>;
    let itemRepo: Repository<InventoryItem>;
    let sizeRepo: Repository<InventoryItemSize>;
    let categoryRepo: Repository<InventoryItemCategory>;
    let vendorRepo: Repository<InventoryItemVendor>;

    let categories: InventoryItemCategory[];
    let vendors: InventoryItemVendor[];
    let packages: InventoryItemPackage[];
    let items: InventoryItem[];
    let sizes: InventoryItemSize[];

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule({
            inventoryItemSizeServiceClass: TestableInventoryItemSizeService,
        });
        testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
        sizeService = module.get(InventoryItemSizeService) as TestableInventoryItemSizeService;
        dataSource = module.get(DataSource);

        packageRepo = module.get(getRepositoryToken(InventoryItemPackage));
        itemRepo = module.get(getRepositoryToken(InventoryItem));
        sizeRepo = module.get(getRepositoryToken(InventoryItemSize));
        categoryRepo = module.get(getRepositoryToken(InventoryItemCategory));
        vendorRepo = module.get(getRepositoryToken(InventoryItemVendor));

        ({ categories, vendors, packages, items, sizes } = await testingUtil.seedSizes(P));
    });

    afterAll(async () => {
        await sizeRepo.delete(sizes.map((s) => s.id));
        await itemRepo.delete(items.map((i) => i.id));
        await packageRepo.delete(packages.map((p) => p.id));
        await categoryRepo.delete(categories.map((c) => c.id));
        await vendorRepo.delete(vendors.map((v) => v.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    describe('size lifecycle', () => {
        let created: InventoryItemSize;

        it('should create size', async () => {
            const dto = plainToInstance(CreateInventoryItemSizeDto, {
                inventoryItemId: items[0].id,
                packageId: packages[0].id,
                unit: 'lb',
                measureAmount: 100,
                cost: 12.5,
            });
            await dataSource.transaction(async (manager) => {
                created = await sizeService.createEntityForTest(dto, manager);
            });
            expect(created.id).toBeDefined();
            expect(created.measureAmount).toBe(100);
            expect(Number(created.cost)).toBe(12.5);
        });

        it('should update size', async () => {
            const loaded = await sizeRepo.findOneOrFail({
                where: { id: created.id },
                relations: ['package'],
            });
            const dto = plainToInstance(UpdateInventoryItemSizeDto, {
                cost: 25.99,
                packageId: loaded.package.id,
                unit: loaded.unit,
                measureAmount: loaded.measureAmount,
            });
            await dataSource.transaction(async (manager) => {
                await sizeService.updateEntityForTest(dto, loaded, manager);
                await manager.save(loaded);
            });
            const reloaded = await sizeRepo.findOneOrFail({ where: { id: created.id } });
            expect(Number(reloaded.cost)).toBe(25.99);
        });

        it('should remove size', async () => {
            await sizeService.remove(created.id);
            await expect(sizeService.findOne(created.id)).rejects.toThrow(NotFoundException);
        });
    });

    it('should find seeded size in findAll results', async () => {
        const result = await sizeService.findAll({ limit: 100 });
        const found = result.items.find((s) => s.id === sizes[0].id);
        expect(found).toBeDefined();
    });

    it('should find one size with relations', async () => {
        const result = await sizeService.findOne(sizes[0].id, ['inventoryItem', 'package']);
        expect(result.id).toBe(sizes[0].id);
        expect(result.inventoryItem).toBeDefined();
        expect(result.package).toBeDefined();
        expect(typeof result.unit).toBe('string');
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(sizeService.findOne(9_999_999)).rejects.toThrow(NotFoundException);
    });
});
