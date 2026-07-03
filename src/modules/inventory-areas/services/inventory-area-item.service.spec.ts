import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { NestedCreateInventoryItemSizeDto } from '../../inventory-items/dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { NestedUpdateInventoryItemSizeDto } from '../../inventory-items/dto/inventory-item-size/nested-update-inventory-item-size.dto';
import { InventoryItemCategory } from '../../inventory-items/entities/inventory-item-category.entity';
import { InventoryItemPackage } from '../../inventory-items/entities/inventory-item-package.entity';
import { InventoryItemSize } from '../../inventory-items/entities/inventory-item-size.entity';
import { InventoryItemVendor } from '../../inventory-items/entities/inventory-item-vendor.entity';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { CreateInventoryAreaItemDto } from '../dto/inventory-area-item/create-inventory-area-item.dto';
import { UpdateInventoryAreaItemDto } from '../dto/inventory-area-item/update-inventory-area-item.dto';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryAreaItem } from '../entities/inventory-area-item.entity';
import { InventoryArea } from '../entities/inventory-area.entity';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaItemService } from './inventory-area-item.service';

class TestableInventoryAreaItemService extends InventoryAreaItemService {
    async createEntityForTest(
        dto: CreateInventoryAreaItemDto,
        manager: EntityManager,
    ) {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateInventoryAreaItemDto,
        entity: InventoryAreaItem,
        manager: EntityManager,
    ) {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('Inventory area item service', () => {
    let testingUtil: InventoryAreaTestUtil;
    let areaItemService: TestableInventoryAreaItemService;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;

    let areaRepo: Repository<InventoryArea>;
    let countRepo: Repository<InventoryAreaCount>;
    let areaItemRepo: Repository<InventoryAreaItem>;
    let categoryRepo: Repository<InventoryItemCategory>;
    let vendorRepo: Repository<InventoryItemVendor>;
    let packageRepo: Repository<InventoryItemPackage>;
    let itemRepo: Repository<InventoryItem>;
    let sizeRepo: Repository<InventoryItemSize>;

    let areas: InventoryArea[];
    let counts: InventoryAreaCount[];
    let categories: InventoryItemCategory[];
    let vendors: InventoryItemVendor[];
    let packages: InventoryItemPackage[];
    let items: InventoryItem[];
    let sizes: InventoryItemSize[];

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule({
            areaItemServiceClass: TestableInventoryAreaItemService,
        });
        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
        areaItemService = module.get(
            InventoryAreaItemService,
        ) as TestableInventoryAreaItemService;
        dataSource = module.get(DataSource);

        areaRepo = module.get(getRepositoryToken(InventoryArea));
        countRepo = module.get(getRepositoryToken(InventoryAreaCount));
        areaItemRepo = module.get(getRepositoryToken(InventoryAreaItem));
        categoryRepo = module.get(getRepositoryToken(InventoryItemCategory));
        vendorRepo = module.get(getRepositoryToken(InventoryItemVendor));
        packageRepo = module.get(getRepositoryToken(InventoryItemPackage));
        itemRepo = module.get(getRepositoryToken(InventoryItem));
        sizeRepo = module.get(getRepositoryToken(InventoryItemSize));

        ({ areas, counts } = await testingUtil.seedCounts(P));
        ({ categories, vendors, packages, items, sizes } =
            await testingUtil.seedInventoryItems(P));
    });

    afterAll(async () => {
        await countRepo.delete(counts.map((c) => c.id));
        await sizeRepo.delete(sizes.map((s) => s.id));
        await itemRepo.delete(items.map((i) => i.id));
        await packageRepo.delete(packages.map((p) => p.id));
        await categoryRepo.delete(categories.map((c) => c.id));
        await vendorRepo.delete(vendors.map((v) => v.id));
        await areaRepo.delete(areas.map((a) => a.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    describe('area item lifecycle', () => {
        let areaItem: InventoryAreaItem;

        it('should create area item with countedItemSizeId', async () => {
            const dto = plainToInstance(CreateInventoryAreaItemDto, {
                parentInventoryCountId: counts[0].id,
                countedInventoryItemId: items[0].id,
                countedItemSizeId: sizes[0].id,
                amount: 5,
            });
            await dataSource.transaction(async (manager) => {
                areaItem = await areaItemService.createEntityForTest(dto, manager);
            });
            expect(areaItem.id).toBeDefined();
            expect(areaItem.parentInventoryCount.id).toBe(counts[0].id);
            expect(areaItem.countedInventoryItem.id).toBe(items[0].id);
            expect(areaItem.countedItemSize.id).toBe(sizes[0].id);
            expect(areaItem.amount).toBe(5);
        });

        it('should update area item with countedItemSizeId', async () => {
            const dto = plainToInstance(UpdateInventoryAreaItemDto, {
                countedInventoryItemId: items[0].id,
                countedItemSizeId: sizes[1].id,
                amount: 7,
            });
            await dataSource.transaction(async (manager) => {
                await areaItemService.updateEntityForTest(dto, areaItem, manager);
            });
            const reloaded = await areaItemRepo.findOneOrFail({
                where: { id: areaItem.id },
                relations: ['countedItemSize'],
            });
            expect(reloaded.countedItemSize.id).toBe(sizes[1].id);
            expect(reloaded.amount).toBe(7);
        });

        it('should remove area item', async () => {
            await areaItemService.remove(areaItem.id);
            await expect(areaItemService.findOne(areaItem.id)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    it('should create area item with countedItemSizeDto', async () => {
        const sizeDto = plainToInstance(NestedCreateInventoryItemSizeDto, {
            createId: 'c1',
            unit: 'lb',
            measureAmount: 2,
            packageId: packages[0].id,
            cost: 3.5,
        });
        const dto = plainToInstance(CreateInventoryAreaItemDto, {
            parentInventoryCountId: counts[0].id,
            countedInventoryItemId: items[1].id,
            countedItemSize: sizeDto,
            amount: 4,
        });

        let created: InventoryAreaItem;
        await dataSource.transaction(async (manager) => {
            created = await areaItemService.createEntityForTest(dto, manager);
        });
        testCtx.addCleanupFunction(async () => {
            await areaItemRepo.delete(created.id);
        });

        expect(created!.id).toBeDefined();
        expect(created!.parentInventoryCount.id).toBe(counts[0].id);
        expect(created!.countedInventoryItem.id).toBe(items[1].id);
        expect(created!.countedItemSize.measureAmount).toBe(2);
        expect(Number(created!.countedItemSize.cost)).toBe(3.5);
        expect(created!.amount).toBe(4);
    });

    it('should update area item with countedItemSizeDto', async () => {
        let created: InventoryAreaItem;
        await dataSource.transaction(async (manager) => {
            created = await areaItemService.createEntityForTest(
                plainToInstance(CreateInventoryAreaItemDto, {
                    parentInventoryCountId: counts[0].id,
                    countedInventoryItemId: items[2].id,
                    countedItemSizeId: sizes[4].id,
                    amount: 1,
                }),
                manager,
            );
        });
        testCtx.addCleanupFunction(async () => {
            await areaItemRepo.delete(created.id);
        });

        const sizeDto = plainToInstance(NestedUpdateInventoryItemSizeDto, {
            id: sizes[4].id,
            measureAmount: 5,
            cost: 6.25,
        });
        const dto = plainToInstance(UpdateInventoryAreaItemDto, {
            countedInventoryItemId: items[2].id,
            countedItemSize: sizeDto,
            amount: 9,
        });
        await dataSource.transaction(async (manager) => {
            await areaItemService.updateEntityForTest(dto, created, manager);
        });

        const reloaded = await areaItemRepo.findOneOrFail({
            where: { id: created!.id },
            relations: ['countedItemSize'],
        });
        expect(reloaded.countedItemSize.measureAmount).toBe(5);
        expect(Number(reloaded.countedItemSize.cost)).toBe(6.25);
        expect(reloaded.amount).toBe(9);
    });

    it('should find seeded area item in findAll search results', async () => {
        let created: InventoryAreaItem;
        await dataSource.transaction(async (manager) => {
            created = await areaItemService.createEntityForTest(
                plainToInstance(CreateInventoryAreaItemDto, {
                    parentInventoryCountId: counts[1].id,
                    countedInventoryItemId: items[3].id,
                    countedItemSizeId: sizes[6].id,
                    amount: 1,
                }),
                manager,
            );
        });
        testCtx.addCleanupFunction(async () => {
            await areaItemRepo.delete(created.id);
        });

        const result = await areaItemService.findAll({
            search: items[3].name,
            limit: 100,
        });
        const found = result.items.find((i) => i.id === created!.id);
        expect(found).toBeDefined();
    });

    it('should find seeded area items filtered by inventoryAreaCount', async () => {
        let created: InventoryAreaItem;
        await dataSource.transaction(async (manager) => {
            created = await areaItemService.createEntityForTest(
                plainToInstance(CreateInventoryAreaItemDto, {
                    parentInventoryCountId: counts[1].id,
                    countedInventoryItemId: items[0].id,
                    countedItemSizeId: sizes[0].id,
                    amount: 1,
                }),
                manager,
            );
        });
        testCtx.addCleanupFunction(async () => {
            await areaItemRepo.delete(created.id);
        });

        const result = await areaItemService.findAll({
            filters: [`inventoryAreaCount=${counts[1].id}`],
            limit: 100,
        });
        const found = result.items.find((i) => i.id === created!.id);
        expect(found).toBeDefined();
        expect(
            result.items.every(
                (i) =>
                    i.parentInventoryCount?.id === counts[1].id ||
                    !i.parentInventoryCount,
            ),
        ).toBe(true);
    });

    it('should find one area item with relations', async () => {
        let created: InventoryAreaItem;
        await dataSource.transaction(async (manager) => {
            created = await areaItemService.createEntityForTest(
                plainToInstance(CreateInventoryAreaItemDto, {
                    parentInventoryCountId: counts[0].id,
                    countedInventoryItemId: items[0].id,
                    countedItemSizeId: sizes[0].id,
                    amount: 1,
                }),
                manager,
            );
        });
        testCtx.addCleanupFunction(async () => {
            await areaItemRepo.delete(created.id);
        });

        const result = await areaItemService.findOne(created!.id, [
            'countedInventoryItem',
            'countedItemSize',
        ]);
        expect(result.id).toBe(created!.id);
        expect(result.countedInventoryItem?.id).toBe(items[0].id);
        expect(result.countedItemSize?.id).toBe(sizes[0].id);
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(areaItemService.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });
});
