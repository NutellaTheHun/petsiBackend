import { TestingModule } from "@nestjs/testing";
import { AREA_A, AREA_B } from "../utils/constants";
import { getInventoryAreasTestingModule } from "../utils/inventory-areas-testing.module";
import { InventoryAreaCountService } from "./inventory-area-count.service";
import { InventoryAreaService } from "./inventory-area.service";
import { InventoryAreaTestUtil } from "../utils/inventory-area-test.util";
import { CreateInventoryAreaCountDto } from "../dto/create-inventory-area-count.dto";
import { UpdateInventoryAreaCountDto } from "../dto/update-inventory-area-count.dto";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { InventoryItemPackageService } from "../../inventory-items/services/inventory-item-package.service";
import { CreateInventoryItemSizeDto } from "../../inventory-items/dto/create-inventory-item-size.dto";
import { FL_OUNCE, POUND } from "../../unit-of-measure/utils/constants";
import { NotFoundException } from "@nestjs/common";
import { BOX_PKG, DRY_B, FOOD_C, OTHER_A, OTHER_PKG } from "../../inventory-items/utils/constants";
import { InventoryAreaItemService } from "./inventory-area-item.service";
import { UpdateInventoryAreaItemDto } from "../dto/update-inventory-area-item-count.dto";
import { UpdateInventoryItemSizeDto } from "../../inventory-items/dto/update-inventory-item-size.dto";
import { CreateInventoryAreaItemDto } from "../dto/create-inventory-area-item.dto";

describe('Inventory area item count service', () => {
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
        if(!areaA){ throw new NotFoundException(); }
        const dto = { inventoryAreaId: areaA.id } as CreateInventoryAreaCountDto;

        const result = await countService.create(dto);
        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull();

        testAreaId = areaA.id as number;
        testCountId = result?.id as number;
    });

    it('should update inventoryArea\'s list of areaCounts', async () => {
        const areaA = await areaService.findOneByName(AREA_A, ["inventoryCounts"]);
        if(!areaA){ throw new Error('inventory area not found'); }

        expect(areaA?.inventoryCounts).not.toBeUndefined();
        expect(areaA?.inventoryCounts?.length).toEqual(2);
    });

    it('should THROW ERROR, to create area count (no areaID)', async () => {
        const dto = { } as CreateInventoryAreaCountDto;

        await expect(countService.create(dto)).rejects.toThrow(Error);
    });

    it('should THROW ERROR, to create area count (bad areaID)', async () => {
        const dto = { inventoryAreaId: 10 } as CreateInventoryAreaCountDto;
        await expect(countService.create(dto)).rejects.toThrow(Error);
    });

    it('should update areaCount\'s area', async () => {
        const newArea = await areaService.findOneByName(AREA_B);
        if(!newArea){ throw new Error('new inventoryArea not found'); }

        const toUpdate = await countService.findOne(testCountId)
        if(!toUpdate){ throw new Error('inventory count to update not found'); }

        const result = await countService.update(
            toUpdate.id, 
            { inventoryAreaId: newArea.id } as UpdateInventoryAreaCountDto,
        );

        expect(result).not.toBeNull();
        expect(result?.inventoryArea.id).toEqual(newArea.id);
        expect(result?.inventoryArea.name).toEqual(newArea.name);
    });

    it('should remove inventoryCount reference from old inventory Area, and update new one', async () => {
        const oldArea = await areaService.findOneByName(AREA_A, ["inventoryCounts"]);
        if(!oldArea){ throw new Error('old inventory area not found'); }
        expect(oldArea?.inventoryCounts?.length).toEqual(1);

        const newArea = await areaService.findOneByName(AREA_B, ["inventoryCounts"]);
        if(!newArea){ throw new Error('new inventoryArea not found'); }
        if(!newArea.inventoryCounts){ throw new Error('new inventoryAreas inventory counts not found'); }
        expect(newArea?.inventoryCounts).not.toBeNull();
        expect(newArea?.inventoryCounts?.length).toEqual(2); // Area B has 1 area count by default from test initialization
        expect(newArea?.inventoryCounts.findIndex(count => count.id === testCountId)).not.toEqual(-1);
    });

    it('should fail to update area count (doesnt exist)', async () => {
        const newArea = await areaService.findOneByName(AREA_B);
        if(!newArea){ throw new Error('new inventoryArea not found'); }

        const toUpdate = await countService.findOne(testCountId)
        if(!toUpdate){ throw new Error('inventory count to update not found'); }

        const result = await countService.update(
            0, 
            { inventoryAreaId: newArea.id } as UpdateInventoryAreaCountDto
        );

        expect(result).toBeNull();
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
        const results = await countService.findAll()
        expect(results).not.toBeNull();
        expect(results.length).toEqual(8); // all test inventory counts (6) plus one created in tests above
    });

    it('should get area counts by id', async () => {
        const results = await countService.findEntitiesById(testCountIds);

        expect(results).not.toBeNull();
        expect(results.length).toEqual(testCountIds.length);
        for(const result of results){
            expect(testCountIds.find(id => result.id)).toBeTruthy();
        }
    });

    it('should update area count with (created) counted items, with pre-existing sizes and created sizes', async () => {
        const items = await itemService.findAll(['sizes']);
        if(!items){ throw new Error("items is null"); }

        const packages = await packageService.findAll();
        if(!packages){ throw new Error("packages is null"); }
        const units = await measureService.findAll();
        if(!units){ throw new Error("units is null"); }

        if(!items[0].sizes){ throw new Error("first item's sizes is null"); }
        const item_a = { itemId: items[0].id, itemSizeId: items[0].sizes[0].id }

        if(!items[1].sizes){ throw new Error("first item's sizes is null"); }
        const item_b = { itemId: items[1].id, itemSizeId: items[1].sizes[0].id }

        const uom = await measureService.findOneByName(POUND);
        if(!uom){ throw new NotFoundException(); }
        const pkg = await packageService.findOneByName(BOX_PKG);
        if(!pkg){ throw new NotFoundException(); }

        const sizeDto = {
            mode: 'create',
            unitOfMeasureId: uom.id,
            inventoryPackageTypeId: pkg.id,
            inventoryItemId: items[2].id,
        } as CreateInventoryItemSizeDto;
        const item_c = { itemId: items[2].id, sizeDto }

        const itemCountDtos = testingUtil.createInventoryAreaItemDtos(
            testAreaId,
            testCountId,
            [ item_a, item_b, item_c],
        );

        const updateCountDto = {
            itemCountDtos
        } as UpdateInventoryAreaCountDto;

        const result = await countService.update(testCountId, updateCountDto);
        expect(result).not.toBeNull();
        expect(result?.items?.length).toEqual(3);

        testItemCountIds = result?.items?.map(item => item.id) as number[];
    });

    it('should query newly counted items from itemCountService', async () => {
        const results = await areaItemService.findEntitiesById(testItemCountIds, ['areaCount', 'inventoryArea', 'size', 'item']);
        if(!results){ throw new Error("results is null"); }
        
        for(const item of results){
            expect(item.areaCount).not.toBeNull();
            expect(item.inventoryArea).not.toBeNull();
            expect(item.item).not.toBeNull();
            expect(item.size).not.toBeNull();
        }
    });

    it('should update an area count item\'s unit amount', async () => {
        const areaCount = await countService.findOne(testCountId, ['items'], ['items.size']);
        if(!areaCount){ throw new NotFoundException(); }
        if(!areaCount.items){ throw new Error("area count's items is null"); }

        updateItemTestId = areaCount.items[0].id;
        const updateAreaItemDto = {
            mode: 'update',
            id: updateItemTestId,
            unitAmount: 10,
        } as UpdateInventoryAreaItemDto;

        const theRest = areaCount.items.splice(1).map( areaItem => ({
            mode: 'update',
            id: areaItem.id
        } as UpdateInventoryAreaItemDto))

        const updateAreaCountDto = {
            itemCountDtos: [updateAreaItemDto, ...theRest]
        } as UpdateInventoryAreaCountDto;

        const result = await countService.update(testCountId, updateAreaCountDto);
        if(!result?.items){ throw new Error("results area items is null"); }

        expect(result).not.toBeNull();
        expect(result?.items?.length).toEqual(3);
        for(const item of result?.items){
            if(item.id === updateItemTestId){
                expect(item.unitAmount).toEqual(10);
            }
        }
    });

    it('should update unit amount of queried area item', async () => {
        const result = await areaItemService.findOne(updateItemTestId);
        expect(result).not.toBeNull();
        expect(result?.unitAmount).toEqual(10);
    });

    it('should update an area count item\'s measure amount', async () => {
        const areaCount = await countService.findOne(testCountId, ['items'], ['items.size']);
        if(!areaCount){ throw new NotFoundException(); }
        if(!areaCount.items){ throw new Error("area count's items is null"); }

        updateItemTestId = areaCount.items[0].id;

        const updateAreaItemDto = {
            mode: 'update',
            id: updateItemTestId,
            measureAmount: 10,
        } as UpdateInventoryAreaItemDto;

        const theRest = areaCount.items.splice(1).map( areaItem => ({
            mode: 'update',
            id: areaItem.id
        } as UpdateInventoryAreaItemDto))

        const updateAreaCountDto = {
            itemCountDtos: [updateAreaItemDto, ...theRest]
        } as UpdateInventoryAreaCountDto;

        const result = await countService.update(testCountId, updateAreaCountDto);
        if(!result?.items){ throw new Error("results area items is null"); }

        expect(result).not.toBeNull();
        expect(result?.items?.length).toEqual(3);
        for(const item of result?.items){
            if(item.id === updateItemTestId){
                expect(item.measureAmount).toEqual(10);
            }
        }
    });

    it('should update measure amount of queried area item', async () => {
        const result = await areaItemService.findOne(updateItemTestId);
        expect(result).not.toBeNull();
        expect(result?.measureAmount).toEqual(10);
    });

    it('should update an area count item\'s size unit of measure', async () => {
        const areaCount = await countService.findOne(testCountId, ['items'], ['items.size']);
        if(!areaCount){ throw new NotFoundException(); }
        if(!areaCount.items){ throw new Error("area count's items is null"); }

        updateItemTestId = areaCount.items[0].id;
        itemSizeTestId = areaCount.items[0].size.id;

        const uom = await measureService.findOneByName(FL_OUNCE);
        if(!uom){ throw new NotFoundException(); }
        const itemSizeUpdateDto = {
            mode: 'update',
            id: itemSizeTestId,
            unitOfMeasureId: uom.id,
        } as UpdateInventoryItemSizeDto;

        const updateAreaItemDto = {
            mode: 'update',
            id: updateItemTestId,
            itemSizeDto: itemSizeUpdateDto,
        } as UpdateInventoryAreaItemDto;

        const theRest = areaCount.items.splice(1).map( areaItem => ({
            mode: 'update',
            id: areaItem.id
        } as UpdateInventoryAreaItemDto))

        const updateAreaCountDto = {
            itemCountDtos: [updateAreaItemDto, ...theRest]
        } as UpdateInventoryAreaCountDto;

        const result = await countService.update(testCountId, updateAreaCountDto);
        if(!result?.items){ throw new Error("results area items is null"); }

        expect(result).not.toBeNull();
        expect(result?.items?.length).toEqual(3);
        for(const item of result?.items){
            if(item.id === updateItemTestId){
                expect(item.size.measureUnit.name).toEqual(FL_OUNCE);
            }
        }
    });

    it('should update an area count item size\'s package', async () => {
        const areaCount = await countService.findOne(testCountId, ['items'], ['items.size']);
        if(!areaCount){ throw new NotFoundException(); }
        if(!areaCount.items){ throw new Error("area count's items is null"); }

        updateItemTestId = areaCount.items[0].id;
        itemSizeTestId = areaCount.items[0].size.id;

        const pkg = await packageService.findOneByName(OTHER_PKG);
        if(!pkg){ throw new NotFoundException(); }
        const itemSizeUpdateDto = {
            mode: 'update',
            id: itemSizeTestId,
            inventoryPackageTypeId: pkg.id,
        } as UpdateInventoryItemSizeDto;

        const updateAreaItemDto = {
            mode: 'update',
            id: updateItemTestId,
            itemSizeDto: itemSizeUpdateDto,
        } as UpdateInventoryAreaItemDto;

        const theRest = areaCount.items.splice(1).map( areaItem => ({
            mode: 'update',
            id: areaItem.id
        } as UpdateInventoryAreaItemDto))

        const updateAreaCountDto = {
            itemCountDtos: [updateAreaItemDto, ...theRest]
        } as UpdateInventoryAreaCountDto;

        const result = await countService.update(testCountId, updateAreaCountDto);
        if(!result?.items){ throw new Error("results area items is null"); }

        expect(result).not.toBeNull();
        expect(result?.items?.length).toEqual(3);
        for(const item of result?.items){
            if(item.id === updateItemTestId){
                expect(item.size.packageType.name).toEqual(OTHER_PKG);
            }
        }
    });

    it('should update an area count item\'s inventory item (which means also size)', async () => {
        const areaCount = await countService.findOne(testCountId, ['items'], ['items.size']);
        if(!areaCount){ throw new NotFoundException(); }
        if(!areaCount.items){ throw new Error("area count's items is null"); }

        updateItemTestId = areaCount.items[0].id;
        itemSizeTestId = areaCount.items[0].size.id;

        const item = await itemService.findOneByName(FOOD_C);
        if(!item){ throw new NotFoundException(); }
        const itemSizeUpdateDto = {
            mode: 'update',
            id: itemSizeTestId,
            inventoryItemId: item.id,
        } as UpdateInventoryItemSizeDto;

        const updateAreaItemDto = {
            mode: 'update',
            id: updateItemTestId,
            inventoryItemId: item.id,
            itemSizeDto: itemSizeUpdateDto,
        } as UpdateInventoryAreaItemDto;

        const theRest = areaCount.items.splice(1).map( areaItem => ({
            mode: 'update',
            id: areaItem.id
        } as UpdateInventoryAreaItemDto))

        const updateAreaCountDto = {
            itemCountDtos: [updateAreaItemDto, ...theRest]
        } as UpdateInventoryAreaCountDto;

        const result = await countService.update(testCountId, updateAreaCountDto);
        if(!result?.items){ throw new Error("results area items is null"); }

        expect(result).not.toBeNull();
        expect(result?.items?.length).toEqual(3);
        for(const item of result?.items){
            if(item.id === updateItemTestId){
                expect(item.item.name).toEqual(FOOD_C);
            }
        }
    });

    it('should reflect new item for item size when queried', async () => {
        const result = await areaItemService.findOne(updateItemTestId, ['size'], ['size.item']);
        expect(result).not.toBeNull();
        expect(result?.size.item.name).toEqual(FOOD_C);
    });

    it('should update an area count item\'s with creating a new counted item, modifying another item, and removing another item', async () => {
        const areaCount = await countService.findOne(testCountId, ['items'], ['items.size']);
        if(!areaCount){ throw new NotFoundException(); }
        if(!areaCount.items){ throw new Error("area count's items is null"); }

        updateItemTestId = areaCount.items[0].id;

        const updateAreaItemDto = {
            mode: 'update',
            id: updateItemTestId,
            unitAmount: 50,
        } as UpdateInventoryAreaItemDto;

        const item = await itemService.findOneByName(DRY_B, ['sizes'])
        if(!item){ throw new NotFoundException(); }
        if(!item.sizes){ throw new Error("item sizes is null"); }
        const createAreaItemDto = {
            mode: 'create',
            inventoryAreaId: testAreaId,
            areaCountId: testCountId,
            unitAmount: 100,
            measureAmount: 200,
            inventoryItemId: item.id,
            itemSizeId: item.sizes[0].id,
        } as CreateInventoryAreaItemDto;

        const theRest = {
            mode: 'update',
            id: areaCount.items[1].id
        } as UpdateInventoryAreaItemDto;

        deletedAreaItemId = areaCount.items[2].id;

        const updateAreaCountDto = {
            itemCountDtos: [ updateAreaItemDto, createAreaItemDto, theRest]
        } as UpdateInventoryAreaCountDto;

        const result = await countService.update(testCountId, updateAreaCountDto);
        if(!result?.items){ throw new Error("results area items is null"); }
        expect(result).not.toBeNull();
        expect(result.items.length).toEqual(3);
        expect(result.items.findIndex(item => item.id === deletedAreaItemId)).toEqual(-1);

        testItemCountIds = result.items.map(i => i.id);
    });

    it('should update an area count item\'s to not have removed item', async () => {
        const result = await areaItemService.findOne(deletedAreaItemId);
        expect(result).toBeNull();
    });

    it('should remove area count', async () => {
        const result = await countService.remove(testCountId);
        expect(result).toBeTruthy();

        const verify = await countService.findOne(testCountId);
        expect(verify).toBeNull();

        const area = await areaService.findOneByName(AREA_B, ["inventoryCounts"]);
        expect(area?.inventoryCounts?.length).toEqual(1);
    });

    it('should remove area count items associated with removed area count', async () => {
        const results = await areaItemService.findEntitiesById(testItemCountIds);
        expect(results.length).toEqual(0);
    });
});