import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Like, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { NestedCreateInventoryItemSizeDto } from '../../inventory-items/dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { NestedUpdateInventoryItemSizeDto } from '../../inventory-items/dto/inventory-item-size/nested-update-inventory-item-size.dto';
import { InventoryItemSize } from '../../inventory-items/entities/inventory-item-size.entity';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { CreateInventoryAreaItemDto } from '../dto/inventory-area-item/create-inventory-area-item.dto';
import { UpdateInventoryAreaItemDto } from '../dto/inventory-area-item/update-inventory-area-item.dto';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryAreaItem } from '../entities/inventory-area-item.entity';
import { InventoryArea } from '../entities/inventory-area.entity';
import { AREA_A } from '../utils/constants';
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

describe('Inventory area item service', () => {
    let module: TestingModule;
    let testingUtil: InventoryAreaTestUtil;
    let dbTestContext: DatabaseTestContext;
    let areaItemService: TestableInventoryAreaItemService;
    let dataSource: DataSource;

    let inventoryAreaRepo: Repository<InventoryArea>;
    let inventoryAreaItemRepo: Repository<InventoryAreaItem>;
    let inventoryAreaCountRepo: Repository<InventoryAreaCount>;

    let inventoryItemRepo: Repository<InventoryItem>;
    let inventoryItemSizeRepo: Repository<InventoryItemSize>;

    beforeAll(async () => {
        module = await getInventoryAreasTestingModule({
            areaItemServiceClass: TestableInventoryAreaItemService,
        });

        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
        dbTestContext = new DatabaseTestContext();
        await testingUtil.initInventoryAreaItemCountTestDatabase(dbTestContext);

        dataSource = module.get(DataSource);

        areaItemService = module.get(
            InventoryAreaItemService,
        ) as TestableInventoryAreaItemService;

        inventoryAreaRepo = module.get(getRepositoryToken(InventoryArea));
        inventoryAreaItemRepo = module.get(getRepositoryToken(InventoryAreaItem));
        inventoryAreaCountRepo = module.get(getRepositoryToken(InventoryAreaCount));
        inventoryItemRepo = module.get(getRepositoryToken(InventoryItem));
        inventoryItemSizeRepo = module.get(getRepositoryToken(InventoryItemSize));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(areaItemService).toBeDefined();
    });

    // test createEntity() with countedItemSizeId
    it('should create area item with countedItemSizeId', async () => {
        const count = await inventoryAreaCountRepo.findOne({
            where: { inventoryArea: { name: AREA_A } },
        });
        if (!count) throw new Error('count not found');

        const item = await inventoryItemRepo.findOne({
            where: {},
            relations: ['sizes'],
        });
        if (!item?.sizes?.length) throw new Error('item with sizes not found');

        const dto = plainToInstance(CreateInventoryAreaItemDto, {
            parentInventoryCountId: count.id,
            countedInventoryItemId: item.id,
            countedItemSizeId: item.sizes[0].id,
            amount: 5,
        });

        await dataSource.transaction(async (manager) => {
            const result = await areaItemService.createEntityForTest(dto, manager);

            expect(result).not.toBeNull();
            expect(result?.id).not.toBeNull();
            expect(result.parentInventoryCount.id).toEqual(count.id);
            expect(result.countedInventoryItem.id).toEqual(item.id);
            expect(result.countedItemSize.id).toEqual(item.sizes[0].id);
            expect(result.amount).toEqual(5);
        });
    });

    // test createEntity() with countedItemSizeDto
    it('should create area item with countedItemSizeDto', async () => {
        const count = await inventoryAreaCountRepo.findOne({
            where: { inventoryArea: { name: AREA_A } },
        });
        if (!count) throw new Error('count not found');

        const item = await inventoryItemRepo.findOne({ where: {} });
        if (!item) throw new Error('item not found');

        const existingSize = await inventoryItemSizeRepo.findOne({
            where: {},
            relations: ['measureType', 'package'],
        });
        if (!existingSize?.measureType || !existingSize?.package) {
            throw new Error('size with measureType and package not found');
        }

        const sizeDto = plainToInstance(NestedCreateInventoryItemSizeDto, {
            createId: 'c1',
            measureTypeId: existingSize.measureType.id,
            measureAmount: 2,
            packageId: existingSize.package.id,
            cost: 3.5,
        });

        const dto = plainToInstance(CreateInventoryAreaItemDto, {
            parentInventoryCountId: count.id,
            countedInventoryItemId: item.id,
            countedItemSize: sizeDto,
            amount: 4,
        });

        await dataSource.transaction(async (manager) => {
            const result = await areaItemService.createEntityForTest(dto, manager);

            expect(result).not.toBeNull();
            expect(result?.id).not.toBeNull();
            expect(result.parentInventoryCount.id).toEqual(count.id);
            expect(result.countedInventoryItem.id).toEqual(item.id);
            expect(result.countedItemSize.measureAmount).toEqual(2);
            expect(Number(result.countedItemSize.cost)).toEqual(3.5);
            expect(result.amount).toEqual(4);
        });
    });

    // test updateEntity() with countedItemSizeId
    it('should update area item with countedItemSizeId', async () => {
        const areaItem = await inventoryAreaItemRepo.findOne({
            where: {},
            relations: ['countedInventoryItem', 'countedItemSize'],
        });
        if (!areaItem) throw new Error('area item not found');

        const item = await inventoryItemRepo.findOne({
            where: { id: areaItem.countedInventoryItem.id },
            relations: ['sizes'],
        });
        if (!item?.sizes?.length) throw new Error('item with sizes not found');
        const newSize =
            item.sizes[0].id === areaItem.countedItemSize.id
                ? item.sizes[item.sizes.length - 1] ?? item.sizes[0]
                : item.sizes[0];

        const dto = plainToInstance(UpdateInventoryAreaItemDto, {
            countedInventoryItemId: areaItem.countedInventoryItem.id,
            countedItemSizeId: newSize.id,
            amount: 7,
        });

        await dataSource.transaction(async (manager) => {
            await areaItemService.updateEntityForTest(dto, areaItem, manager);
        });

        const result = await inventoryAreaItemRepo.findOne({
            where: { id: areaItem.id },
            relations: ['countedItemSize'],
        });
        if (!result) throw new Error('result not found');
        expect(result.countedItemSize.id).toEqual(newSize.id);
        expect(result.amount).toEqual(7);
    });

    // test updateEntity() with countedItemSizeDto
    it('should update area item with countedItemSizeDto', async () => {
        const areaItem = await inventoryAreaItemRepo.findOne({
            where: {},
            relations: ['countedItemSize', 'countedInventoryItem'],
        });
        if (!areaItem) throw new Error('area item not found');

        const sizeDto = plainToInstance(NestedUpdateInventoryItemSizeDto, {
            id: areaItem.countedItemSize.id,
            measureAmount: 5,
            cost: 6.25,
        });

        const dto = plainToInstance(UpdateInventoryAreaItemDto, {
            countedInventoryItemId: areaItem.countedInventoryItem.id,
            countedItemSize: sizeDto,
            amount: 9,
        });

        await dataSource.transaction(async (manager) => {
            await areaItemService.updateEntityForTest(dto, areaItem, manager);
        });

        const result = await inventoryAreaItemRepo.findOne({
            where: { id: areaItem.id },
            relations: ['countedItemSize'],
        });
        if (!result) throw new Error('result not found');
        expect(result.countedItemSize.measureAmount).toEqual(5);
        expect(Number(result.countedItemSize.cost)).toEqual(6.25);
        expect(result.amount).toEqual(9);
    });

    // test findAll()
    it('should find all area items', async () => {
        const repoResult = await inventoryAreaItemRepo.find();
        const serviceResult = await areaItemService.findAll({ limit: 100 });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findall() with search
    it('should find all area items with search', async () => {
        const repoResult = await inventoryAreaItemRepo.find({
            where: { countedInventoryItem: { name: Like('%dry%') } },
        });
        if (repoResult.length === 0) {
            throw new Error('no area items found');
        }
        const serviceResult = await areaItemService.findAll({
            search: 'dry',
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findall() with filter by inventoryAreaCount
    it('should find all area items with filter by inventoryAreaCount', async () => {
        const count = await inventoryAreaCountRepo.findOne({ where: {} });
        if (!count) throw new Error('count not found');

        const repoResult = await inventoryAreaItemRepo.find({
            where: { parentInventoryCount: { id: count.id } },
        });
        const serviceResult = await areaItemService.findAll({
            filters: [`inventoryAreaCount=${count.id}`],
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findall() with sort by countedInventoryItem
    it('should find all area items with sort by countedInventoryItem', async () => {
        const serviceResult = await areaItemService.findAll({
            sortBy: 'countedInventoryItem',
            sortOrder: 'ASC',
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toBeGreaterThan(0);
        for (let i = 1; i < (serviceResult?.items.length ?? 0); i++) {
            const prev = serviceResult!.items[i - 1].countedInventoryItem?.name ?? '';
            const curr = serviceResult!.items[i].countedInventoryItem?.name ?? '';
            expect(prev <= curr).toBe(true);
        }
    });

    // test findall() with sort by amount
    it('should find all area items with sort by amount', async () => {
        const repoResult = await inventoryAreaItemRepo.find({
            order: { amount: 'DESC' },
        });
        const serviceResult = await areaItemService.findAll({
            sortBy: 'amount',
            sortOrder: 'DESC',
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
        if (repoResult.length > 0) {
            expect(serviceResult?.items[0].amount).toEqual(repoResult[0].amount);
            const lastIdx = repoResult.length - 1;
            expect(serviceResult?.items[lastIdx].amount).toEqual(
                repoResult[lastIdx].amount,
            );
        }
    });

    // test findOne()
    it('should find one area item', async () => {
        const areaItem = await inventoryAreaItemRepo.find({ take: 1 });
        if (!areaItem.length) throw new Error('area item not found');

        const serviceResult = await areaItemService.findOne(areaItem[0].id);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(areaItem[0].id);
    });

    // test findOne() with relations
    it('should find one area item with relations', async () => {
        const areaItem = await inventoryAreaItemRepo.find({
            take: 1,
            relations: ['countedInventoryItem', 'countedItemSize'],
        });
        if (!areaItem.length) throw new Error('area item not found');

        const serviceResult = await areaItemService.findOne(areaItem[0].id, [
            'countedInventoryItem',
            'countedItemSize',
        ]);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(areaItem[0].id);
        expect(serviceResult?.countedInventoryItem?.id).toEqual(
            areaItem[0].countedInventoryItem.id,
        );
        expect(serviceResult?.countedItemSize?.id).toEqual(
            areaItem[0].countedItemSize.id,
        );
    });

    // test remove()
    it('should remove area item', async () => {
        const areaItem = await inventoryAreaItemRepo.find({ take: 1 });
        if (!areaItem.length) throw new Error('area item not found');
        const id = areaItem[0].id;

        const deleteResult = await areaItemService.remove(id);
        expect(deleteResult).toBe(true);
        await expect(areaItemService.findOne(id)).rejects.toThrow(NotFoundException);
    });
});
