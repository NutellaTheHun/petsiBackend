import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { NestedCreateInventoryItemSizeDto } from '../../inventory-items/dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { InventoryItemPackage } from '../../inventory-items/entities/inventory-item-package.entity';
import { InventoryItemSize } from '../../inventory-items/entities/inventory-item-size.entity';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { InventoryItemCategory } from '../../inventory-items/entities/inventory-item-category.entity';
import { InventoryItemVendor } from '../../inventory-items/entities/inventory-item-vendor.entity';
import { CreateInventoryAreaCountDto } from '../dto/inventory-area-count/create-inventory-area-count.dto';
import { UpdateInventoryAreaCountDto } from '../dto/inventory-area-count/update-inventory-area-count.dto';
import { NestedCreateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-create-inventory-area-item.dto';
import { NestedUpdateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-update-inventory-area-item.dto';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryArea } from '../entities/inventory-area.entity';
import { inventoryAreaCountToUpdateDto } from '../utils/entity-transformers/inventory-area-count.dto.transformer';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaCountService } from './inventory-area-count.service';

class TestableInventoryAreaCountService extends InventoryAreaCountService {
    async createEntityForTest(
        dto: CreateInventoryAreaCountDto,
        manager: EntityManager,
    ) {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateInventoryAreaCountDto,
        entity: InventoryAreaCount,
        manager: EntityManager,
    ) {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('Inventory area count service', () => {
    let testingUtil: InventoryAreaTestUtil;
    let countService: TestableInventoryAreaCountService;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;

    let areaRepo: Repository<InventoryArea>;
    let countRepo: Repository<InventoryAreaCount>;
    let categoryRepo: Repository<InventoryItemCategory>;
    let vendorRepo: Repository<InventoryItemVendor>;
    let packageRepo: Repository<InventoryItemPackage>;
    let itemRepo: Repository<InventoryItem>;
    let sizeRepo: Repository<InventoryItemSize>;

    let areas: InventoryArea[];
    let categories: InventoryItemCategory[];
    let vendors: InventoryItemVendor[];
    let packages: InventoryItemPackage[];
    let items: InventoryItem[];
    let sizes: InventoryItemSize[];

    const createSeededCount = async (
        areaId: number,
        itemDtos: NestedCreateInventoryAreaItemDto[] = [],
    ): Promise<InventoryAreaCount> => {
        let count!: InventoryAreaCount;
        await dataSource.transaction(async (manager) => {
            count = await countService.createEntityForTest(
                plainToInstance(CreateInventoryAreaCountDto, {
                    inventoryAreaId: areaId,
                    countedInventoryItems: itemDtos,
                }),
                manager,
            );
        });
        testCtx.addCleanupFunction(async () => {
            await countRepo.delete(count.id);
        });
        return count;
    };

    const reloadCount = async (id: number) =>
        countRepo.findOneOrFail({
            where: { id },
            relations: [
                'inventoryArea',
                'countedInventoryItems',
                'countedInventoryItems.countedInventoryItem',
                'countedInventoryItems.countedItemSize',
                'countedInventoryItems.countedItemSize.package',
            ],
        });

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule({
            countServiceClass: TestableInventoryAreaCountService,
        });
        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
        countService = module.get(
            InventoryAreaCountService,
        ) as TestableInventoryAreaCountService;
        dataSource = module.get(DataSource);

        areaRepo = module.get(getRepositoryToken(InventoryArea));
        countRepo = module.get(getRepositoryToken(InventoryAreaCount));
        categoryRepo = module.get(getRepositoryToken(InventoryItemCategory));
        vendorRepo = module.get(getRepositoryToken(InventoryItemVendor));
        packageRepo = module.get(getRepositoryToken(InventoryItemPackage));
        itemRepo = module.get(getRepositoryToken(InventoryItem));
        sizeRepo = module.get(getRepositoryToken(InventoryItemSize));

        ({ areas } = await testingUtil.seedAreas(P));
        ({ categories, vendors, packages, items, sizes } =
            await testingUtil.seedInventoryItems(P));
    });

    afterAll(async () => {
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

    describe('count lifecycle', () => {
        let count: InventoryAreaCount;

        it('should create count with no items', async () => {
            const dto = plainToInstance(CreateInventoryAreaCountDto, {
                inventoryAreaId: areas[0].id,
                countedInventoryItems: [],
            });
            await dataSource.transaction(async (manager) => {
                count = await countService.createEntityForTest(dto, manager);
            });
            expect(count.id).toBeDefined();
            expect(count.inventoryArea.id).toBe(areas[0].id);
            expect(count.countedInventoryItems).toBeUndefined();
        });

        it('should update count inventoryAreaId', async () => {
            const dto = plainToInstance(UpdateInventoryAreaCountDto, {
                inventoryAreaId: areas[1].id,
            });
            await dataSource.transaction(async (manager) => {
                await countService.updateEntityForTest(dto, count, manager);
            });
            const reloaded = await reloadCount(count.id);
            expect(reloaded.inventoryArea.id).toBe(areas[1].id);
        });

        it('should remove count', async () => {
            await countService.remove(count.id);
            await expect(countService.findOne(count.id)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    it('should create count with items by itemSizeId', async () => {
        const itemDtos = [0, 1, 2].map((idx, i) =>
            plainToInstance(NestedCreateInventoryAreaItemDto, {
                createId: `c${i}`,
                countedInventoryItemId: items[idx].id,
                countedItemSizeId: sizes[idx * 2].id,
                amount: 1,
            }),
        );
        const count = await createSeededCount(areas[0].id, itemDtos);
        const reloaded = await reloadCount(count.id);
        expect(reloaded.countedInventoryItems.length).toBe(3);
    });

    it('should create count with items by itemSizeDto', async () => {
        const itemDtos = [0, 1, 2].map((idx, i) =>
            plainToInstance(NestedCreateInventoryAreaItemDto, {
                createId: `c${i}`,
                countedInventoryItemId: items[idx].id,
                amount: 1,
                countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                    createId: `s${i}`,
                    unit: 'lb',
                    measureAmount: 1,
                    packageId: packages[i].id,
                    cost: 1,
                }),
            }),
        );
        const count = await createSeededCount(areas[0].id, itemDtos);
        const reloaded = await reloadCount(count.id);
        expect(reloaded.countedInventoryItems.length).toBe(3);
    });

    it('should create count with items by mixed itemSizeId and itemSizeDto', async () => {
        const idIdtos = [0, 1, 2].map((idx, i) =>
            plainToInstance(NestedCreateInventoryAreaItemDto, {
                createId: `c${i}`,
                countedInventoryItemId: items[idx].id,
                countedItemSizeId: sizes[idx * 2].id,
                amount: 1,
            }),
        );
        const dtoIdtos = [3, 4, 5].map((idx, i) =>
            plainToInstance(NestedCreateInventoryAreaItemDto, {
                createId: `d${i}`,
                countedInventoryItemId: items[idx].id,
                amount: 1,
                countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
                    createId: `s${i}`,
                    unit: 'lb',
                    measureAmount: 1,
                    packageId: packages[i].id,
                    cost: 1,
                }),
            }),
        );
        const count = await createSeededCount(areas[0].id, [...idIdtos, ...dtoIdtos]);
        const reloaded = await reloadCount(count.id);
        expect(reloaded.countedInventoryItems.length).toBe(6);
    });

    it('removes counted inventory items via authoritative parent update', async () => {
        const itemDtos = [0, 1].map((idx, i) =>
            plainToInstance(NestedCreateInventoryAreaItemDto, {
                createId: `c${i}`,
                countedInventoryItemId: items[idx].id,
                countedItemSizeId: sizes[idx * 2].id,
                amount: 1,
            }),
        );
        const count = await createSeededCount(areas[0].id, itemDtos);
        const loaded = await reloadCount(count.id);

        const dto = plainToInstance(UpdateInventoryAreaCountDto, {
            inventoryAreaId: loaded.inventoryArea.id,
            countedInventoryItems: [],
        });
        await dataSource.transaction(async (manager) => {
            await countService.updateEntityForTest(dto, loaded, manager);
        });

        const reloaded = await reloadCount(count.id);
        expect(reloaded.countedInventoryItems.length).toBe(0);
    });

    it('should update an existing counted item', async () => {
        const itemDtos = [0, 1].map((idx, i) =>
            plainToInstance(NestedCreateInventoryAreaItemDto, {
                createId: `c${i}`,
                countedInventoryItemId: items[idx].id,
                countedItemSizeId: sizes[idx * 2].id,
                amount: 1,
            }),
        );
        const count = await createSeededCount(areas[0].id, itemDtos);
        const loaded = await reloadCount(count.id);

        const transform = inventoryAreaCountToUpdateDto(loaded);
        const countedInventoryItems = [...(transform.countedInventoryItems ?? [])];
        const areaItemToUpdate = countedInventoryItems.pop();
        const areaItemUpdateId = (areaItemToUpdate as NestedUpdateInventoryAreaItemDto).id;
        countedInventoryItems.push(
            plainToInstance(NestedUpdateInventoryAreaItemDto, {
                id: areaItemUpdateId,
                countedInventoryItemId: items[2].id,
                countedItemSizeId: sizes[4].id,
                amount: 2,
            }),
        );

        const dto = plainToInstance(UpdateInventoryAreaCountDto, {
            ...transform,
            countedInventoryItems,
        });
        await dataSource.transaction(async (manager) => {
            await countService.updateEntityForTest(dto, loaded, manager);
        });

        const reloaded = await reloadCount(count.id);
        expect(reloaded.countedInventoryItems.length).toBe(2);
        const updated = reloaded.countedInventoryItems.find(
            (i) => i.id === areaItemUpdateId,
        );
        expect(updated?.countedInventoryItem.id).toBe(items[2].id);
        expect(updated?.countedItemSize.id).toBe(sizes[4].id);
        expect(updated?.amount).toBe(2);
    });

    it('should add a new counted item via update', async () => {
        const itemDtos = [0, 1].map((idx, i) =>
            plainToInstance(NestedCreateInventoryAreaItemDto, {
                createId: `c${i}`,
                countedInventoryItemId: items[idx].id,
                countedItemSizeId: sizes[idx * 2].id,
                amount: 1,
            }),
        );
        const count = await createSeededCount(areas[0].id, itemDtos);
        const loaded = await reloadCount(count.id);

        const newItemDto = plainToInstance(NestedCreateInventoryAreaItemDto, {
            createId: 'cNew',
            countedInventoryItemId: items[6].id,
            countedItemSizeId: sizes[12].id,
            amount: 10,
        });
        const dto = inventoryAreaCountToUpdateDto(loaded, {
            countedInventoryItems: [newItemDto],
        });
        await dataSource.transaction(async (manager) => {
            await countService.updateEntityForTest(dto, loaded, manager);
        });

        const reloaded = await reloadCount(count.id);
        expect(reloaded.countedInventoryItems.length).toBe(3);
        const created = reloaded.countedInventoryItems.find(
            (i) => i.countedInventoryItem.id === items[6].id,
        );
        expect(created?.countedItemSize.id).toBe(sizes[12].id);
        expect(created?.amount).toBe(10);
    });

    it('should create and update counted items with itemSizeDtos in one update', async () => {
        const itemDtos = [0, 1].map((idx, i) =>
            plainToInstance(NestedCreateInventoryAreaItemDto, {
                createId: `c${i}`,
                countedInventoryItemId: items[idx].id,
                countedItemSizeId: sizes[idx * 2].id,
                amount: 1,
            }),
        );
        const count = await createSeededCount(areas[0].id, itemDtos);
        const loaded = await reloadCount(count.id);

        const createSizeDto = plainToInstance(NestedCreateInventoryItemSizeDto, {
            createId: 'sNew',
            packageId: packages[2].id,
            unit: 'lb',
            measureAmount: 1,
            cost: 1,
        });
        const createdItemDto = plainToInstance(NestedCreateInventoryAreaItemDto, {
            createId: 'cNew',
            countedInventoryItemId: items[3].id,
            countedItemSize: createSizeDto,
            amount: 20,
        });

        const transform = inventoryAreaCountToUpdateDto(loaded, {
            countedInventoryItems: [createdItemDto],
        });
        const countedInventoryItems = [...(transform.countedInventoryItems ?? [])];
        const areaItemToUpdate = countedInventoryItems.pop();
        const areaItemUpdateId = (areaItemToUpdate as NestedUpdateInventoryAreaItemDto).id;

        const updateSizeDto = plainToInstance(NestedCreateInventoryItemSizeDto, {
            createId: 'sUpdate',
            packageId: packages[2].id,
            unit: 'lb',
            measureAmount: 1,
            cost: 1,
        });
        countedInventoryItems.push(
            plainToInstance(NestedUpdateInventoryAreaItemDto, {
                id: areaItemUpdateId,
                countedInventoryItemId: items[4].id,
                countedItemSize: updateSizeDto,
                amount: 30,
            }),
        );

        const dto = plainToInstance(UpdateInventoryAreaCountDto, {
            ...transform,
            countedInventoryItems,
        });
        await dataSource.transaction(async (manager) => {
            await countService.updateEntityForTest(dto, loaded, manager);
        });

        const reloaded = await reloadCount(count.id);
        expect(reloaded.countedInventoryItems.length).toBe(3);
        const created = reloaded.countedInventoryItems.find(
            (i) => i.countedInventoryItem.id === items[3].id,
        );
        expect(created?.amount).toBe(20);
        expect(created?.countedItemSize.package.id).toBe(packages[2].id);
        const updated = reloaded.countedInventoryItems.find(
            (i) => i.id === areaItemUpdateId,
        );
        expect(updated?.countedInventoryItem.id).toBe(items[4].id);
        expect(updated?.amount).toBe(30);
    });

    it('should find seeded count in findAll filtered by inventoryArea', async () => {
        const count = await createSeededCount(areas[3].id);
        const result = await countService.findAll({
            filters: [`inventoryArea=${areas[3].id}`],
            limit: 100,
        });
        const found = result.items.find((c) => c.id === count.id);
        expect(found).toBeDefined();
        expect(
            result.items.every(
                (c) => c.inventoryArea?.id === areas[3].id || !c.inventoryArea,
            ),
        ).toBe(true);
    });

    it('should find seeded count in findAll search results', async () => {
        const itemDto = plainToInstance(NestedCreateInventoryAreaItemDto, {
            createId: 'c0',
            countedInventoryItemId: items[0].id,
            countedItemSizeId: sizes[0].id,
            amount: 1,
        });
        const count = await createSeededCount(areas[0].id, [itemDto]);
        const result = await countService.findAll({
            search: items[0].name,
            limit: 100,
        });
        const found = result.items.find((c) => c.id === count.id);
        expect(found).toBeDefined();
    });

    it('should find seeded count in findAll within date range', async () => {
        const count = await createSeededCount(areas[0].id);
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const startDate = startOfMonth.toISOString().split('T')[0];
        const endDate = endOfMonth.toISOString().split('T')[0];

        const result = await countService.findAll({
            limit: 100,
            startDate,
            endDate,
        });
        const found = result.items.find((c) => c.id === count.id);
        expect(found).toBeDefined();
    });

    it('should find one count with relations', async () => {
        const count = await createSeededCount(areas[0].id);
        const result = await countService.findOne(count.id, ['inventoryArea']);
        expect(result.id).toBe(count.id);
        expect(result.inventoryArea.id).toBe(areas[0].id);
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(countService.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(InventoryAreaCountService.prototype as any, 'updateEntity');
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when DTO matches current state', async () => {
            const itemDtos = [0, 1].map((idx, i) =>
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: `c${i}`,
                    countedInventoryItemId: items[idx].id,
                    countedItemSizeId: sizes[idx * 2].id,
                    amount: 1,
                }),
            );
            const count = await createSeededCount(areas[0].id, itemDtos);
            const loaded = await reloadCount(count.id);

            const dto = inventoryAreaCountToUpdateDto(loaded);
            const result = await countService.update(count.id, dto);
            expect(result.id).toBe(count.id);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when a nested item amount changes', async () => {
            const itemDtos = [0, 1].map((idx, i) =>
                plainToInstance(NestedCreateInventoryAreaItemDto, {
                    createId: `c${i}`,
                    countedInventoryItemId: items[idx].id,
                    countedItemSizeId: sizes[idx * 2].id,
                    amount: 1,
                }),
            );
            const count = await createSeededCount(areas[0].id, itemDtos);
            const loaded = await reloadCount(count.id);

            const transform = inventoryAreaCountToUpdateDto(loaded);
            const countedInventoryItems = [...(transform.countedInventoryItems ?? [])];
            const areaItemToUpdate = countedInventoryItems.pop();
            const areaItemUpdateId = (areaItemToUpdate as NestedUpdateInventoryAreaItemDto)
                .id;
            countedInventoryItems.push(
                plainToInstance(NestedUpdateInventoryAreaItemDto, {
                    id: areaItemUpdateId,
                    countedInventoryItemId: items[1].id,
                    countedItemSizeId: sizes[2].id,
                    amount: 2,
                }),
            );
            const dto = plainToInstance(UpdateInventoryAreaCountDto, {
                ...transform,
                countedInventoryItems,
            });

            await countService.update(count.id, dto);
            expect(spy).toHaveBeenCalled();

            const reloaded = await reloadCount(count.id);
            const updated = reloaded.countedInventoryItems.find(
                (i) => i.id === areaItemUpdateId,
            );
            expect(updated?.amount).toBe(2);
        });
    });
});
