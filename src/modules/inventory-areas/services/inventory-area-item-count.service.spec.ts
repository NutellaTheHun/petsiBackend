import { TestingModule } from "@nestjs/testing";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { DRY_A, DRY_B, FOOD_A, FOOD_B, FOOD_C, OTHER_A, OTHER_B } from "../../inventory-items/utils/constants";
import { cleanupInventoryItemTestingDatabaseLayerTWO, setupInventoryItemTestingDatabaseLayerTWO } from "../../inventory-items/utils/setupTestingDatabase";
import { CreateInventoryAreaCountDto } from "../dto/create-inventory-area-count.dto";
import { CreateInventoryAreaItemCountDto } from "../dto/create-inventory-area-item-count.dto";
import { UpdateInventoryAreaCountDto } from "../dto/update-inventory-area-count.dto";
import { UpdateInventoryAreaItemCountDto } from "../dto/update-inventory-area-item-count.dto";
import { InventoryAreaItemCount } from "../entities/inventory-area-item-count.entity";
import { AREA_A, AREA_B } from "../utils/constants";
import { InventoryAreaTestUtil } from "../utils/inventory-area-test.util";
import { getInventoryAreasTestingModule } from "../utils/inventory-areas-testing.module";
import { InventoryAreaCountService } from "./inventory-area-count.service";
import { InventoryAreaItemCountService } from "./inventory-area-item-count.service";
import { InventoryAreaService } from "./inventory-area.service";

describe('Inventory area item count service', () => {
    let module: TestingModule;
    let testingUtil : InventoryAreaTestUtil;
    let itemCountService: InventoryAreaItemCountService;

    let inventoryAreaService: InventoryAreaService;
    let inventoryCountService: InventoryAreaCountService;
    let itemService: InventoryItemService;

    let countedItemId: number;
    let countedItemIds: number[];
    let inventoryCountId: number;
    let newInventoryCountId: number;
    let inventoryAreaId: number;

    beforeAll(async () => {
        module = await getInventoryAreasTestingModule();
        await setupInventoryItemTestingDatabaseLayerTWO(module);

        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
        await testingUtil.initializeInventoryAreaDatabaseTesting();
        await testingUtil.initializeInventoryAreaCountTestingDataBase();

        itemCountService = module.get<InventoryAreaItemCountService>(InventoryAreaItemCountService);
        inventoryAreaService = module.get<InventoryAreaService>(InventoryAreaService);
        inventoryCountService = module.get<InventoryAreaCountService>(InventoryAreaCountService);
        itemService = module.get<InventoryItemService>(InventoryItemService);
    })

    afterAll(async () => {
        await itemCountService.getQueryBuilder().delete().execute();
        await inventoryAreaService.getQueryBuilder().delete().execute();
        await inventoryCountService.getQueryBuilder().delete().execute();
        await cleanupInventoryItemTestingDatabaseLayerTWO(module);
    });

    it('should be defined', () => {
        expect(itemCountService).toBeDefined();
    });

    it('should create an itemCount', async () => {
        const area = await inventoryAreaService.findOneByName(AREA_A);
        if(!area){ throw new Error("area a not found"); }
        inventoryAreaId = area.id;

        const areaCount = await inventoryCountService.create({ inventoryAreaId: area.id } as CreateInventoryAreaCountDto)
        if(!areaCount){ throw new Error("area count creation failed"); }
        inventoryCountId = areaCount.id

        const item = await itemService.findOneByName(FOOD_C, ["sizes"]);
        if(!item){ throw new Error('failed to find inventory item'); }
        if(!item.sizes){ throw new Error('item sizes is null'); }
        if(item.sizes?.length === 0){ throw new Error('inventory item has no size'); }

        const dto = {
            inventoryAreaId: inventoryAreaId,
            areaCountId: inventoryCountId,
            inventoryItemId: item.id,
            unitAmount: 1,
            measureAmount: 1,
            itemSizeId: item?.sizes[0].id,
        } as CreateInventoryAreaItemCountDto;

        const result = await itemCountService.create(dto);
        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull();
        
        if(result?.id){ countedItemId = result?.id; }
    });

    it('should update itemCount', async () => {
        const toUpdate = await itemCountService.findOne(countedItemId);
        if(!toUpdate){ throw new Error('counted item to update is null'); }

        const newArea = await inventoryAreaService.findOneByName(AREA_B);
        if(!newArea){ throw new Error("area b not found"); }
        newInventoryCountId = newArea.id;

        const newCount = await inventoryCountService.create({ inventoryAreaId: newArea.id } as CreateInventoryAreaCountDto)
        if(!newCount){ throw new Error("new count creation failed"); }
        newInventoryCountId = newCount.id;

        const newItem = await itemService.findOneByName(FOOD_B, ["sizes"]);
        if(!newItem?.sizes){ throw new Error('new item has no sizes'); }

        const newSize = newItem?.sizes[0];

        const updateDto = {
            inventoryAreaId: newArea?.id,
            areaCountId: newInventoryCountId,
            inventoryItemId: newItem.id,
            unitAmount: 2,
            measureAmount: 3,
            itemSizeId: newSize.id,
        } as UpdateInventoryAreaItemCountDto;

        const result = await itemCountService.update(toUpdate.id, updateDto);
        expect(result).not.toBeNull();
        expect(result?.inventoryArea.id).toEqual(newArea?.id);
        expect(result?.areaCount.id).toEqual(newInventoryCountId);
        expect(result?.item.id).toEqual(newItem.id);
        expect(result?.unitAmount).toEqual(2);
        expect(result?.measureAmount).toEqual(3);
        expect(result?.size.id).toEqual(newSize.id);
    });

    it('should fail to update an itemCount (doesnt exist)', async () => {
        const toUpdate = await itemCountService.findOne(countedItemId);
        if(!toUpdate){ throw new Error('counted item to update is null'); }

        const updateDto = { } as UpdateInventoryAreaItemCountDto;

        const result = await itemCountService.update(0, updateDto);
        expect(result).toBeNull();
    });

    it('should remove itemCount', async () => {
        const result = await itemCountService.remove(countedItemId);
        expect(result).toBeTruthy();

        const verify = await itemCountService.findOne(countedItemId);
        expect(verify).toBeNull();
    });

    it('should insert many itemCounts for both testing areaCounts', async () => {
        const area_A = await inventoryAreaService.findOneByName(AREA_A);
        const results_A = await inventoryCountService.findByAreaName(AREA_A);
        if(!results_A){ throw new Error('inventory count for area A is null'); }
        const areaCount_A = results_A[0];

        const food_A = await itemService.findOneByName(FOOD_A, ["sizes"]);
        if(!food_A?.sizes){ throw new Error('inventory item sizes is null'); }
        const foodSize_A = food_A.sizes[0];

        const other_A = await itemService.findOneByName(OTHER_A, ["sizes"]);
        if(!other_A?.sizes){ throw new Error('inventory item sizes is null'); }
        const otherSize_A = other_A.sizes[0];

        const dry_A = await itemService.findOneByName(DRY_A, ["sizes"]);
        if(!dry_A?.sizes){ throw new Error('inventory item sizes is null'); }
        const drySize_A = dry_A.sizes[0];

        const items_A: InventoryAreaItemCount[] = [
            {
                inventoryArea: area_A,
                areaCount: areaCount_A,
                item: food_A,
                unitAmount: 1,
                measureAmount: 1,
                size: foodSize_A,
            } as InventoryAreaItemCount,
            {
                inventoryArea: area_A,
                areaCount: areaCount_A,
                item: other_A,
                unitAmount: 2,
                measureAmount: 2,
                size: otherSize_A,
            }  as InventoryAreaItemCount,
            {
                inventoryArea: area_A,
                areaCount: areaCount_A,
                item: dry_A,
                unitAmount: 3,
                measureAmount: 3,
                size: drySize_A,
            }  as InventoryAreaItemCount,
        ];

        const countedItemIds_A: number[] = []
        for(const countedItem of items_A){
            const result = await itemCountService.create({
                inventoryAreaId: countedItem.inventoryArea.id,
                areaCountId: countedItem.areaCount.id,
                inventoryItemId: countedItem.item.id,
                unitAmount: countedItem.unitAmount,
                measureAmount: countedItem.measureAmount,
                itemSizeId: countedItem.size.id,
                } as CreateInventoryAreaItemCountDto
            );
            if(!result){ throw new Error('created item count for count_A is null'); }

            if(result?.id){ 
                countedItemIds_A.push(result?.id);
            }
        }
        countedItemIds = [ countedItemIds_A[0], countedItemIds_A[1]];
        const updateResult_A = await inventoryCountService.update(
            areaCount_A.id, 
            { inventoryItemCountIds: countedItemIds_A } as UpdateInventoryAreaCountDto
        );

        expect(updateResult_A).not.toBeNull();
        expect(updateResult_A?.items?.length).toEqual(countedItemIds_A.length);

        const area_B = await inventoryAreaService.findOneByName(AREA_B);
        const results_B = await inventoryCountService.findByAreaName(AREA_B);
        if(!results_B){ throw new Error('inventory count for area B is null'); }
        const areaCount_B = results_B[0];

        const food_B = await itemService.findOneByName(FOOD_B, ["sizes"]);
        if(!food_B?.sizes){ throw new Error('inventory item sizes is null'); }
        const foodSize_B = food_B.sizes[0];

        const other_B = await itemService.findOneByName(OTHER_B, ["sizes"]);
        if(!other_B?.sizes){ throw new Error('inventory item sizes is null'); }
        const otherSize_B = other_B.sizes[0];

        const dry_B = await itemService.findOneByName(DRY_B, ["sizes"]);
        if(!dry_B?.sizes){ throw new Error('inventory item sizes is null'); }
        const drySize_B = dry_B.sizes[0];

        const items_B: InventoryAreaItemCount[] = [
            {
                inventoryArea: area_B,
                areaCount: areaCount_B,
                item: food_B,
                unitAmount: 11,
                measureAmount: 11,
                size: foodSize_B,
            } as InventoryAreaItemCount,
            {
                inventoryArea: area_B,
                areaCount: areaCount_B,
                item: other_B,
                unitAmount: 22,
                measureAmount: 22,
                size: otherSize_B,
            } as InventoryAreaItemCount,
            {
                inventoryArea: area_B,
                areaCount: areaCount_B,
                item: dry_B,
                unitAmount: 33,
                measureAmount: 33,
                size: drySize_B,
            } as InventoryAreaItemCount,
        ];



        const countedItemIds_B: number[] = []
        for(const countedItem of items_B){
            const result = await itemCountService.create({
                    inventoryAreaId: countedItem.inventoryArea.id,
                    areaCountId: countedItem.areaCount.id,
                    inventoryItemId: countedItem.item.id,
                    unitAmount: countedItem.unitAmount,
                    measureAmount: countedItem.measureAmount,
                    itemSizeId: countedItem.size.id,
                } as CreateInventoryAreaItemCountDto
            );
            if(!result){ throw new Error('created item count for count_B is null'); }

            if(result?.id){ 
                countedItemIds_B.push(result?.id);
            }
        }
        const updateResult_B = await inventoryCountService.update(
            areaCount_B.id,
            { inventoryItemCountIds: countedItemIds_B, } as UpdateInventoryAreaCountDto
        );
        expect(updateResult_B).not.toBeNull();
        expect(updateResult_B?.items?.length).toEqual(countedItemIds_B.length);
    });

    it('should find by area name', async () => {
        const results = await itemCountService.findByAreaName(AREA_B);

        expect(results).not.toBeNull();
        expect(results.length).toEqual(3);
    });

    it('should find by item name', async () => {
        const results = await itemCountService.findByItemName(FOOD_B, ["item"]);

        expect(results).not.toBeNull();
        expect(results.length).toEqual(1);
        expect(results[0].item.name).toEqual(FOOD_B);
    });

    it('should find all itemCounts', async () => {
        const results = await itemCountService.findAll();

        expect(results).not.toBeNull();
        expect(results.length).toEqual(6);
    });

    it('should find itemCounts by list of IDs', async () => {
        const results = await itemCountService.findEntitiesById(countedItemIds);
        expect(results).not.toBeNull();
        expect(results.length).toEqual(countedItemIds.length);
    });
});