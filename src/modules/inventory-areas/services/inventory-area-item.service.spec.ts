import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { DRY_A, DRY_B, FOOD_A, FOOD_B, FOOD_C, OTHER_A, OTHER_B } from "../../inventory-items/utils/constants";
import { CreateInventoryAreaCountDto } from "../dto/create-inventory-area-count.dto";
import { CreateInventoryAreaItemDto } from "../dto/create-inventory-area-item.dto";
import { UpdateInventoryAreaCountDto } from "../dto/update-inventory-area-count.dto";
import { UpdateInventoryAreaItemDto } from "../dto/update-inventory-area-item-count.dto";
import { InventoryAreaItem } from "../entities/inventory-area-item.entity";
import { AREA_A, AREA_B } from "../utils/constants";
import { InventoryAreaTestUtil } from "../utils/inventory-area-test.util";
import { getInventoryAreasTestingModule } from "../utils/inventory-areas-testing.module";
import { InventoryAreaCountService } from "./inventory-area-count.service";
import { InventoryAreaItemService } from "./inventory-area-item.service";
import { InventoryAreaService } from "./inventory-area.service";
import { NotFoundException } from "@nestjs/common";
import { InventoryItemSizeService } from "../../inventory-items/services/inventory-item-size.service";

describe('Inventory area item service', () => {
    let module: TestingModule;
    let testingUtil : InventoryAreaTestUtil;
    let dbTestContext: DatabaseTestContext;

    let areaItemService: InventoryAreaItemService;
    let areaService: InventoryAreaService;
    let countService: InventoryAreaCountService;

    let itemService: InventoryItemService;
    let sizeService: InventoryItemSizeService;

    let testId: number;
    let testIds: number[];

    let oldAreaCountId: number;
    let newAreaCountId: number;

    beforeAll(async () => {
        module = await getInventoryAreasTestingModule();

        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
        dbTestContext = new DatabaseTestContext();
        await testingUtil.initInventoryAreaItemCountTestDatabase(dbTestContext);

        areaItemService = module.get<InventoryAreaItemService>(InventoryAreaItemService);
        areaService = module.get<InventoryAreaService>(InventoryAreaService);
        countService = module.get<InventoryAreaCountService>(InventoryAreaCountService);

        itemService = module.get<InventoryItemService>(InventoryItemService);
        sizeService = module.get<InventoryItemSizeService>(InventoryItemSizeService);
    })

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(areaItemService).toBeDefined();
    });

    it('should create an item', async () => {
        const area = await areaService.findOneByName(AREA_A);
        if(!area){ throw new NotFoundException(); }

        const counts = await countService.findByAreaName(AREA_A);
        if(!counts){ throw new NotFoundException(); }
        if(!counts[0]) throw new Error("area a counts is empty");

        const item = await itemService.findOneByName(FOOD_A, ["sizes"]);
        if(!item){ throw new NotFoundException(); }
        if(!item.sizes){ throw new Error("item sizes is null"); }

        const dto = {
            inventoryAreaId: area.id,
            areaCountId: counts[0].id,
            inventoryItemId: item.id,
            unitAmount: 1,
            measureAmount: 1,
            itemSizeId: item.sizes[0].id
        } as CreateInventoryAreaItemDto;

        const result = await areaItemService.create(dto);

        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull();
        expect(result?.inventoryArea.id).toEqual(area.id);
        expect(result?.areaCount.id).toEqual(counts[0].id);
        expect(result?.item.id).toEqual(item.id);
        expect(result?.size.id).toEqual(item.sizes[0].id);
        expect(result?.unitAmount).toEqual(1);
        expect(result?.measureAmount).toEqual(1);

        testId = result?.id as number;
        oldAreaCountId = counts[0].id;
    });

    it('should update the inventory count\'s reference of items', async () => {
        const count = await countService.findOne(oldAreaCountId,['items']);
        if(!count){ throw new NotFoundException(); }

        expect(count.items?.findIndex(item => item.id === testId)).not.toEqual(-1);
    });

    it('should update an item (inventory area)', async () => {
        const newArea = await areaService.findOneByName(AREA_B);
        if(!newArea){ throw new NotFoundException(); }

        const dto = {
            inventoryAreaId: newArea.id,
        } as UpdateInventoryAreaItemDto;

        const result = await areaItemService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.inventoryArea.id).toEqual(newArea.id);
    });

    it('should update an item (inventory area count)', async () => {
        const newCounts = await countService.findByAreaName(AREA_B);
        if(!newCounts){ throw new NotFoundException(); }
        if(!newCounts[0]){ throw new Error("area B has no counts"); }

        const dto = {
            areaCountId: newCounts[0].id,
        } as UpdateInventoryAreaItemDto;

        const result = await areaItemService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.areaCount.id).toEqual(newCounts[0].id);

        newAreaCountId = newCounts[0].id;
    });

    it('should lose areaItem reference on old inventory area count', async () => {
        const oldCount = await countService.findOne(oldAreaCountId, ['items']);
        if(!oldCount){ throw new NotFoundException(); }

        expect(oldCount.items?.findIndex(item => item.id === testId)).toEqual(-1);
    });

    it('should gain areaItem reference on new inventory area count', async () => {
        const newCount = await countService.findOne(newAreaCountId, ['items']);
        if(!newCount){ throw new NotFoundException(); }

        expect(newCount.items?.findIndex(item => item.id === testId)).not.toEqual(-1);
    });

    it('should update an item (inventory item and item size)', async () => {
        const newItem = await itemService.findOneByName(FOOD_B, ['sizes']);
        if(!newItem){ throw new NotFoundException(); }
        if(!newItem.sizes){ throw new Error("item sizes is empty"); }

        const dto = {
            inventoryItemId: newItem.id,
            itemSizeId: newItem.sizes[0].id
        } as UpdateInventoryAreaItemDto;

        const result = await areaItemService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.item.id).toEqual(newItem.id);
        expect(result?.size.id).toEqual(newItem.sizes[0].id);
    });

    it('should update an item (unit amount)', async () => {
        const dto = {
            unitAmount: 2,
        } as UpdateInventoryAreaItemDto;

        const result = await areaItemService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.unitAmount).toEqual(2);
    });

    it('should update an item (measure amount)', async () => {
        const dto = {
            measureAmount: 2,
        } as UpdateInventoryAreaItemDto;

        const result = await areaItemService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.measureAmount).toEqual(2);
    });

    it('should fail to update an item (not found)', async () => {
        const dto = {
            measureAmount: 2,
        } as UpdateInventoryAreaItemDto;

        const result = await areaItemService.update(0, dto);
        expect(result).toBeNull();
    });

    it('should get all items', async () => {
        const results = await areaItemService.findAll({limit: 20});
        expect(results).not.toBeNull();
        expect(results.items.length).toEqual(15);

        testIds = [ results.items[0].id, results.items[1].id, results.items[2].id ];
    });

    it('should get items by list of ids', async () => {
        const results = await areaItemService.findEntitiesById(testIds);
        expect(results).not.toBeNull();
        expect(results.length).toEqual(testIds.length);
    });

    it('should get items by area name', async () => {
        const results = await areaItemService.findByAreaName(AREA_B);
        expect(results).not.toBeNull();
        expect(results.length).toBeGreaterThan(0);
    });

    it('should get area items by InventoryItem name', async () => {
        const results = await areaItemService.findByItemName(FOOD_B);
        expect(results).not.toBeNull();
        expect(results.length).toBeGreaterThan(0);
    });

    it('should get one item by id', async () => {
        const result = await areaItemService.findOne(testId);
        expect(result).not.toBeNull();
    });

    it('should fail to get one item by id (not found)', async () => {
        const result = await areaItemService.findOne(0);
        expect(result).toBeNull();
    });

    it('should remove one item by id', async () => {
        const removal = await areaItemService.remove(testId);
        expect(removal).toBeTruthy();

        const verify = await areaItemService.findOne(0);
        expect(verify).toBeNull();
    });

    it('should remove one item by id (not found)', async () => {
        const removal = await areaItemService.remove(testId);
        expect(removal).toBeFalsy();
    });

    // if an inventory item size is deleted, the referencing inv area item count should be deleted
    it('should delete area items when it\'s referenced itemSize is deleted', async () => {
        const items = await areaItemService.findByItemName(FOOD_B, ['size']);
        if(!items){ throw new NotFoundException(); }

        const item = items[0];
        
        const removal = await sizeService.remove(item.size.id);
        if(!removal){ throw new Error("size removal failed"); }

        const verify = await areaItemService.findOne(item.id);
        expect(verify).toBeNull();
    });

    it('should delete area items when it\'s referenced inventoryItem is deleted', async () => {
        const areaItems = await areaItemService.findByItemName(FOOD_C, ['item']);
        if(!areaItems){ throw new NotFoundException(); }

        const areaItem = areaItems[0];
        
        const removal = await itemService.remove(areaItem.item.id);
        if(!removal){ throw new Error("inventory item removal failed"); }

        const verify = await areaItemService.findOne(areaItem.id);
        expect(verify).toBeNull(); 
    });

    // if the count is deleted, the inv area item count should be deleted
    it('should delete area items when it\'s referenced inventoryAreaCount is deleted', async () => {
        const areaItems = await areaItemService.findByItemName(DRY_A, ['areaCount']);
        if(!areaItems){ throw new NotFoundException(); }
        if(!areaItems[0]){ throw new Error("areaItems is empty"); }

        const areaItem = areaItems[0];
        
        const removal = await countService.remove(areaItem.areaCount.id);
        if(!removal){ throw new Error("inventory count removal failed"); }

        const verify = await areaItemService.findOne(areaItem.id);
        expect(verify).toBeNull(); 
    });

    // if the inventory area is deleted, the inv area item count should be deleted
    it('should delete area items when it\'s referenced inventoryArea is deleted', async () => {
        const areaItems = await areaItemService.findByItemName(FOOD_A, ['inventoryArea']);
        if(!areaItems){ throw new NotFoundException(); }

        const areaItem = areaItems[0];
        
        const removal = await areaService.remove(areaItem.inventoryArea.id);
        if(!removal){ throw new Error("inventory area removal failed"); }

        const verify = await areaItemService.findOne(areaItem.id);
        expect(verify).toBeNull(); 
    });
});