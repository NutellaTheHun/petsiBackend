import { NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateChildInventoryItemSizeDto } from "../../inventory-items/dto/inventory-item-size/create-child-inventory-item-size.dto";
import { UpdateChildInventoryItemSizeDto } from "../../inventory-items/dto/inventory-item-size/update-child-inventory-item-size.dto";
import { InventoryItemPackageService } from "../../inventory-items/services/inventory-item-package.service";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { BOX_PKG, DRY_B, FOOD_A, FOOD_C, OTHER_PKG } from "../../inventory-items/utils/constants";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { FL_OUNCE, POUND } from "../../unit-of-measure/utils/constants";
import { CreateInventoryAreaCountDto } from "../dto/inventory-area-count/create-inventory-area-count.dto";
import { UpdateInventoryAreaCountDto } from "../dto/inventory-area-count/update-inventory-area-count.dto";
import { CreateInventoryAreaItemDto } from "../dto/inventory-area-item/create-inventory-area-item.dto";
import { UpdateChildInventoryAreaItemDto } from "../dto/inventory-area-item/update-child-inventory-area-item.dto";
import { UpdateInventoryAreaItemDto } from "../dto/inventory-area-item/update-inventory-area-item.dto";
import { AREA_A, AREA_B } from "../utils/constants";
import { InventoryAreaTestUtil } from "../utils/inventory-area-test.util";
import { getInventoryAreasTestingModule } from "../utils/inventory-areas-testing.module";
import { InventoryAreaCountService } from "./inventory-area-count.service";
import { InventoryAreaItemService } from "./inventory-area-item.service";
import { InventoryAreaService } from "./inventory-area.service";

describe('Inventory area count service', () => {
    let testingUtil: InventoryAreaTestUtil;
    let dbTestContext: DatabaseTestContext;

    let countService: InventoryAreaCountService;
    let areaService: InventoryAreaService;
    let areaItemService: InventoryAreaItemService;

    let itemService: InventoryItemService;
    let measureService: UnitOfMeasureService;
    let packageService: InventoryItemPackageService;

    let testAreaId: number;
    let testCountId: number;
    let testCountIds: number[];

    let testItemCountIds: number[];
    let updateItemTestId: number;
    let itemSizeTestId: number;
    let deletedAreaItemId: number;

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
        await testingUtil.initInventoryAreaItemCountTestDatabase(dbTestContext);

        countService = module.get<InventoryAreaCountService>(InventoryAreaCountService);
        areaService = module.get<InventoryAreaService>(InventoryAreaService);
        areaItemService = module.get<InventoryAreaItemService>(InventoryAreaItemService);

        itemService = module.get<InventoryItemService>(InventoryItemService);
        measureService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
        packageService = module.get<InventoryItemPackageService>(InventoryItemPackageService);
    })

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(countService).toBeDefined();
    });

    it('should create area count', async () => {
        const areaA = await areaService.findOneByName(AREA_A);
        if (!areaA) { throw new NotFoundException(); }
        const dto = { inventoryAreaId: areaA.id } as CreateInventoryAreaCountDto;

        const result = await countService.create(dto);
        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull();

        testAreaId = areaA.id as number;
        testCountId = result?.id as number;
    });

    it('should update inventoryArea\'s list of areaCounts', async () => {
        const areaA = await areaService.findOneByName(AREA_A, ["inventoryCounts"]);
        if (!areaA) { throw new Error('inventory area not found'); }

        expect(areaA?.inventoryCounts).not.toBeUndefined();
        expect(areaA?.inventoryCounts?.length).toEqual(2);
    });

    it('should THROW ERROR, to create area count (bad areaID)', async () => {
        const dto = { inventoryAreaId: 10 } as CreateInventoryAreaCountDto;
        await expect(countService.create(dto)).rejects.toThrow(Error);
    });

    it('should update areaCount\'s area', async () => {
        const newArea = await areaService.findOneByName(AREA_B);
        if (!newArea) { throw new Error('new inventoryArea not found'); }

        const toUpdate = await countService.findOne(testCountId)
        if (!toUpdate) { throw new Error('inventory count to update not found'); }

        const result = await countService.update(
            toUpdate.id,
            { inventoryAreaId: newArea.id } as UpdateInventoryAreaCountDto,
        );

        expect(result).not.toBeNull();
        expect(result?.inventoryArea.id).toEqual(newArea.id);
        expect(result?.inventoryArea.areaName).toEqual(newArea.areaName);
    });

    it('should remove inventoryCount reference from old inventory Area, and update new one', async () => {
        const oldArea = await areaService.findOneByName(AREA_A, ["inventoryCounts"]);
        if (!oldArea) { throw new Error('old inventory area not found'); }
        expect(oldArea?.inventoryCounts?.length).toEqual(1);

        const newArea = await areaService.findOneByName(AREA_B, ["inventoryCounts"]);
        if (!newArea) { throw new Error('new inventoryArea not found'); }
        if (!newArea.inventoryCounts) { throw new Error('new inventoryAreas inventory counts not found'); }
        expect(newArea?.inventoryCounts).not.toBeNull();
        expect(newArea?.inventoryCounts?.length).toEqual(2); // Area B has 1 area count by default from test initialization
        expect(newArea?.inventoryCounts.findIndex(count => count.id === testCountId)).not.toEqual(-1);
    });

    it('should fail to update area count (doesnt exist)', async () => {
        const newArea = await areaService.findOneByName(AREA_B);
        if (!newArea) { throw new Error('new inventoryArea not found'); }

        const toUpdate = await countService.findOne(testCountId)
        if (!toUpdate) { throw new Error('inventory count to update not found'); }

        await expect(countService.update(
            0,
            { inventoryAreaId: newArea.id } as UpdateInventoryAreaCountDto
        )).rejects.toThrow(Error);
    });

    it('should find area counts by area', async () => {
        const results = await countService.findByAreaName(AREA_B);
        expect(results).not.toBeNull();
        expect(results.length).toEqual(2);
    });

    it('should find area counts by date', async () => {
        const results = await countService.findByDate(new Date());
        expect(results).not.toBeNull();
        expect(results.length).toEqual(8); // all test inventory counts (6) plus one created in tests above

        testCountIds = [results[0].id];
    });

    it('should get all area counts', async () => {
        const results = await countService.findAll({ relations: ['inventoryArea'] })
        expect(results).not.toBeNull();
        expect(results.items.length).toEqual(8); // all test inventory counts (6) plus one created in tests above
    });

    it('should search area counts', async () => {
        const results = await countService.findAll({ search: FOOD_A })
        expect(results).not.toBeNull();
        expect(results.items.length).toEqual(3);
    });

    it('should filter by inventoryArea', async () => {
        const area = await areaService.findOneByName(AREA_A);
        if (!area) { throw new Error(); }

        const results = await countService.findAll({ filters: [`inventoryArea=${area.id}`] })
        expect(results).not.toBeNull();
        expect(results.items.length).toEqual(1);
    })

    it('should filter by date', async () => {
        const date = new Date();
        const today = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

        const results = await countService.findAll({ startDate: today })
        expect(results).not.toBeNull();
        expect(results.items.length).toEqual(8);
    })

    it('should get area counts by id', async () => {
        const results = await countService.findEntitiesById(testCountIds);

        expect(results).not.toBeNull();
        expect(results.length).toEqual(testCountIds.length);
        for (const result of results) {
            expect(testCountIds.find(id => result.id)).toBeTruthy();
        }
    });

    it('should update area count with (created) counted items, with pre-existing sizes and created sizes', async () => {
        const itemsRequest = await itemService.findAll({ relations: ['itemSizes'] });
        const items = itemsRequest.items;
        if (!items) { throw new Error("items is null"); }

        const packagesRequest = await packageService.findAll();
        const packages = packagesRequest.items;
        if (!packages) { throw new Error("packages is null"); }

        const unitsRequest = await measureService.findAll();
        const units = unitsRequest.items;
        if (!units) { throw new Error("units is null"); }

        if (!items[0].itemSizes) { throw new Error("first item's sizes is null"); }
        const item_a = { itemId: items[0].id, itemSizeId: items[0].itemSizes[0].id }

        if (!items[1].itemSizes) { throw new Error("first item's sizes is null"); }
        const item_b = { itemId: items[1].id, itemSizeId: items[1].itemSizes[0].id }

        const uom = await measureService.findOneByName(POUND);
        if (!uom) { throw new NotFoundException(); }
        const pkg = await packageService.findOneByName(BOX_PKG);
        if (!pkg) { throw new NotFoundException(); }

        const sizeDto = {
            mode: 'create',
            measureUnitId: uom.id,
            inventoryPackageId: pkg.id,
            inventoryItemId: items[2].id,
            cost: 12,
            measureAmount: 1,
        } as CreateChildInventoryItemSizeDto;
        const item_c = { itemId: items[2].id, sizeDto }

        const itemCountDtos = testingUtil.createInventoryAreaItemDtos(
            testCountId,
            [item_a, item_b, item_c],
        );

        const updateCountDto = {
            itemCountDtos
        } as UpdateInventoryAreaCountDto;

        const result = await countService.update(testCountId, updateCountDto);
        expect(result).not.toBeNull();
        expect(result?.countedItems?.length).toEqual(3);

        testItemCountIds = result?.countedItems?.map(item => item.id) as number[];
    });

    it('should query newly counted items from itemCountService', async () => {
        const results = await areaItemService.findEntitiesById(testItemCountIds, ['parentInventoryCount', 'countedItemSize', 'countedItem']);
        if (!results) { throw new Error("results is null"); }

        for (const item of results) {
            expect(item.parentInventoryCount).not.toBeNull();
            expect(item.countedItem).not.toBeNull();
            expect(item.countedItemSize).not.toBeNull();
        }
    });

    it('should update an area count item\'s unit amount', async () => {
        const areaCount = await countService.findOne(testCountId, ['countedItems'], ['countedItems.countedItemSize']);
        if (!areaCount) { throw new NotFoundException(); }
        if (!areaCount.countedItems) { throw new Error("area count's items is null"); }

        updateItemTestId = areaCount.countedItems[0].id;
        const updateAreaItemDto = {
            mode: 'update',
            id: updateItemTestId,
            countedAmount: 10,
        } as UpdateInventoryAreaItemDto;

        const theRest = areaCount.countedItems.splice(1).map(areaItem => ({
            mode: 'update',
            id: areaItem.id
        } as UpdateInventoryAreaItemDto))

        const updateAreaCountDto = {
            itemCountDtos: [updateAreaItemDto, ...theRest]
        } as UpdateInventoryAreaCountDto;

        const result = await countService.update(testCountId, updateAreaCountDto);
        if (!result?.countedItems) { throw new Error("results area items is null"); }

        expect(result).not.toBeNull();
        expect(result?.countedItems?.length).toEqual(3);
        for (const item of result?.countedItems) {
            if (item.id === updateItemTestId) {
                expect(item.amount).toEqual(10);
            }
        }
    });

    it('should update unit amount of queried area item', async () => {
        const result = await areaItemService.findOne(updateItemTestId);
        expect(result).not.toBeNull();
        expect(result?.amount).toEqual(10);
    });

    it('should update an area count item\'s size unit of measure', async () => {
        const areaCount = await countService.findOne(testCountId, ['countedItems'], ['countedItems.countedItemSize']);
        if (!areaCount) { throw new NotFoundException(); }
        if (!areaCount.countedItems) { throw new Error("area count's items is null"); }

        updateItemTestId = areaCount.countedItems[0].id;
        itemSizeTestId = areaCount.countedItems[0].countedItemSize.id;

        const uom = await measureService.findOneByName(FL_OUNCE);
        if (!uom) { throw new NotFoundException(); }
        const itemSizeUpdateDto = {
            mode: 'update',
            id: itemSizeTestId,
            measureUnitId: uom.id,

        } as UpdateChildInventoryItemSizeDto;

        const updateAreaItemDto = {
            mode: 'update',
            id: updateItemTestId,
            countedItemSizeDto: itemSizeUpdateDto,
        } as UpdateChildInventoryAreaItemDto;

        const theRest = areaCount.countedItems.splice(1).map(areaItem => ({
            mode: 'update',
            id: areaItem.id
        } as UpdateChildInventoryAreaItemDto))

        const updateAreaCountDto = {
            itemCountDtos: [updateAreaItemDto, ...theRest]
        } as UpdateInventoryAreaCountDto;

        const result = await countService.update(testCountId, updateAreaCountDto);
        if (!result?.countedItems) { throw new Error("results area items is null"); }

        expect(result).not.toBeNull();
        expect(result?.countedItems?.length).toEqual(3);
        for (const item of result?.countedItems) {
            if (item.id === updateItemTestId) {
                expect(item.countedItemSize.measureUnit.name).toEqual(FL_OUNCE);
            }
        }
    });

    it('should update an area count item size\'s package', async () => {
        const areaCount = await countService.findOne(testCountId, ['countedItems'], ['countedItems.countedItemSize']);
        if (!areaCount) { throw new NotFoundException(); }
        if (!areaCount.countedItems) { throw new Error("area count's items is null"); }

        updateItemTestId = areaCount.countedItems[0].id;
        itemSizeTestId = areaCount.countedItems[0].countedItemSize.id;

        const pkg = await packageService.findOneByName(OTHER_PKG);
        if (!pkg) { throw new NotFoundException(); }
        const itemSizeUpdateDto = {
            mode: 'update',
            id: itemSizeTestId,
            inventoryPackageId: pkg.id,
        } as UpdateChildInventoryItemSizeDto;

        const updateAreaItemDto = {
            mode: 'update',
            id: updateItemTestId,
            countedItemSizeDto: itemSizeUpdateDto,
        } as UpdateChildInventoryAreaItemDto;

        const theRest = areaCount.countedItems.splice(1).map(areaItem => ({
            mode: 'update',
            id: areaItem.id
        } as UpdateChildInventoryAreaItemDto))

        const updateAreaCountDto = {
            itemCountDtos: [updateAreaItemDto, ...theRest]
        } as UpdateInventoryAreaCountDto;

        const result = await countService.update(testCountId, updateAreaCountDto);
        if (!result?.countedItems) { throw new Error("results area items is null"); }

        expect(result).not.toBeNull();
        expect(result?.countedItems?.length).toEqual(3);
        for (const item of result?.countedItems) {
            if (item.id === updateItemTestId) {
                expect(item.countedItemSize.packageType.packageName).toEqual(OTHER_PKG);
            }
        }
    });

    it('should update an area count item\'s inventory item (which means also size)', async () => {
        const areaCount = await countService.findOne(testCountId, ['countedItems'], ['countedItems.countedItemSize']);
        if (!areaCount) { throw new NotFoundException(); }
        if (!areaCount.countedItems) { throw new Error("area count's items is null"); }

        updateItemTestId = areaCount.countedItems[0].id;
        itemSizeTestId = areaCount.countedItems[0].countedItemSize.id;

        const item = await itemService.findOneByName(FOOD_C, ['itemSizes']);
        if (!item) { throw new NotFoundException(); }
        if (!item.itemSizes) { throw new NotFoundException(); }

        const updateAreaItemDto = {
            mode: 'update',
            id: updateItemTestId,
            countedInventoryItemId: item.id,
            countedItemSizeId: item.itemSizes[0].id,
        } as UpdateChildInventoryAreaItemDto;

        const theRest = areaCount.countedItems.splice(1).map(areaItem => ({
            mode: 'update',
            id: areaItem.id
        } as UpdateInventoryAreaItemDto))

        const updateAreaCountDto = {
            itemCountDtos: [updateAreaItemDto, ...theRest]
        } as UpdateInventoryAreaCountDto;

        const result = await countService.update(testCountId, updateAreaCountDto);
        if (!result?.countedItems) { throw new Error("results area items is null"); }

        expect(result).not.toBeNull();
        expect(result?.countedItems?.length).toEqual(3);
        for (const item of result?.countedItems) {
            if (item.id === updateItemTestId) {
                expect(item.countedItem.itemName).toEqual(FOOD_C);
            }
        }
    });

    it('should reflect new item for item size when queried', async () => {
        const result = await areaItemService.findOne(updateItemTestId, ['countedItemSize'], ['countedItemSize.inventoryItem']);
        expect(result).not.toBeNull();
        expect(result?.countedItemSize.inventoryItem.itemName).toEqual(FOOD_C);
    });

    it('should update an area count item\'s with creating a new counted item, modifying another item, and removing another item', async () => {
        const areaCount = await countService.findOne(testCountId, ['countedItems'], ['countedItems.countedItemSize']);
        if (!areaCount) { throw new NotFoundException(); }
        if (!areaCount.countedItems) { throw new Error("area count's items is null"); }

        updateItemTestId = areaCount.countedItems[0].id;

        const updateAreaItemDto = {
            mode: 'update',
            id: updateItemTestId,
            countedAmount: 50,
        } as UpdateInventoryAreaItemDto;

        const item = await itemService.findOneByName(DRY_B, ['itemSizes'])
        if (!item) { throw new NotFoundException(); }
        if (!item.itemSizes) { throw new Error("item sizes is null"); }
        const createAreaItemDto = {
            mode: 'create',
            parentInventoryCountId: testCountId,
            countedAmount: 100,
            measureAmount: 200,
            countedInventoryItemId: item.id,
            countedItemSizeId: item.itemSizes[0].id,
        } as CreateInventoryAreaItemDto;

        const theRest = {
            mode: 'update',
            id: areaCount.countedItems[1].id
        } as UpdateInventoryAreaItemDto;

        deletedAreaItemId = areaCount.countedItems[2].id;

        const updateAreaCountDto = {
            itemCountDtos: [updateAreaItemDto, createAreaItemDto, theRest]
        } as UpdateInventoryAreaCountDto;

        const result = await countService.update(testCountId, updateAreaCountDto);
        if (!result?.countedItems) { throw new Error("results area items is null"); }
        expect(result).not.toBeNull();
        expect(result.countedItems.length).toEqual(3);
        expect(result.countedItems.findIndex(item => item.id === deletedAreaItemId)).toEqual(-1);

        testItemCountIds = result.countedItems.map(i => i.id);
    });

    it('should update an area count item\'s to not have removed item', async () => {
        await expect(areaItemService.findOne(deletedAreaItemId)).rejects.toThrow(NotFoundException);
    });

    it('should remove area count', async () => {
        const result = await countService.remove(testCountId);
        expect(result).toBeTruthy();

        await expect(countService.findOne(testCountId)).rejects.toThrow(NotFoundException);

        const area = await areaService.findOneByName(AREA_B, ["inventoryCounts"]);
        expect(area?.inventoryCounts?.length).toEqual(1);
    });

    it('should remove area count items associated with removed area count', async () => {
        const results = await areaItemService.findEntitiesById(testItemCountIds);
        expect(results.length).toEqual(0);
    });
});