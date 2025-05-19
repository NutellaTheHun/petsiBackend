import { BadRequestException, NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { InventoryItemSizeService } from "../../inventory-items/services/inventory-item-size.service";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { DRY_A, FOOD_A, FOOD_B, FOOD_C } from "../../inventory-items/utils/constants";
import { CreateInventoryAreaItemDto } from "../dto/inventory-area-item/create-inventory-area-item.dto";
import { UpdateInventoryAreaItemDto } from "../dto/inventory-area-item/update-inventory-area-item.dto";
import { AREA_A, AREA_B } from "../utils/constants";
import { InventoryAreaTestUtil } from "../utils/inventory-area-test.util";
import { getInventoryAreasTestingModule } from "../utils/inventory-areas-testing.module";
import { InventoryAreaCountService } from "./inventory-area-count.service";
import { InventoryAreaItemService } from "./inventory-area-item.service";
import { InventoryAreaService } from "./inventory-area.service";
import { UpdateInventoryAreaCountDto } from "../dto/inventory-area-count/update-inventory-area-count.dto";
import { UpdateChildInventoryAreaItemDto } from "../dto/inventory-area-item/update-child-inventory-area-item.dto";
import { CreateChildInventoryAreaItemDto } from "../dto/inventory-area-item/create-child-inventory-area-item.dto";

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

    it('should fail to create an item (Bad Request), then add item proper way for the rest of tests', async () => {
        const counts = await countService.findByAreaName(AREA_A, ['countedItems']);
        if(!counts){ throw new NotFoundException(); }
        if(!counts[0]) throw new Error("area a counts is empty");

        const item = await itemService.findOneByName(FOOD_A, ['itemSizes']);
        if(!item){ throw new NotFoundException(); }
        if(!item.itemSizes){ throw new Error("item sizes is null"); }

        const dto = {
            parentInventoryCountId: counts[0].id,
            countedInventoryItemId: item.id,
            countedAmount: 1,
            countedItemSizeId: item.itemSizes[0].id
        } as CreateInventoryAreaItemDto;

        await expect(areaItemService.create(dto)).rejects.toThrow(BadRequestException);

        const createAreaItemDto = {
            mode: 'create',
            countedInventoryItemId: item.id,
            countedAmount: 1,
            countedItemSizeId: item.itemSizes[0].id
        } as CreateChildInventoryAreaItemDto;

        if(!counts[0].countedItems){ throw new Error(); }
        const theRest = counts[0].countedItems.map(item => ({
            mode: 'update',
            id: item.id,
        }) as UpdateChildInventoryAreaItemDto)

        const updateCountDto = {
            itemCountDtos: [createAreaItemDto, ...theRest]
        } as UpdateInventoryAreaCountDto;

        const updateResult = await countService.update(counts[0].id, updateCountDto)
        if(!updateResult){ throw new Error(); }
        if(!updateResult.countedItems){ throw new Error(); }
        
        const result = updateResult.countedItems[0];

        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull();
        expect(result?.parentInventoryCount.id).toEqual(counts[0].id);
        expect(result?.countedItem.id).toEqual(item.id);
        expect(result?.countedItemSize.id).toEqual(item.itemSizes[0].id);
        expect(result?.amount).toEqual(1);

        testId = result?.id as number;
        oldAreaCountId = counts[0].id;
    });

    it('should update the inventory count\'s reference of items', async () => {
        const count = await countService.findOne(oldAreaCountId,['countedItems']);
        if(!count){ throw new NotFoundException(); }

        expect(count.countedItems?.findIndex(item => item.id === testId)).not.toEqual(-1);
    });

    it('should update an item (inventory item and item size)', async () => {
        const newItem = await itemService.findOneByName(FOOD_B, ['itemSizes']);
        if(!newItem){ throw new NotFoundException(); }
        if(!newItem.itemSizes){ throw new Error("item sizes is empty"); }

        const dto = {
            countedInventoryItemId: newItem.id,
            countedItemSizeId: newItem.itemSizes[0].id
        } as UpdateInventoryAreaItemDto;

        const result = await areaItemService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.countedItem.id).toEqual(newItem.id);
        expect(result?.countedItemSize.id).toEqual(newItem.itemSizes[0].id);
    });

    it('should update an item (unit amount)', async () => {
        const dto = {
            countedAmonut: 2,
        } as UpdateInventoryAreaItemDto;

        const result = await areaItemService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.amount).toEqual(2);
    });

    it('should fail to update an item (not found)', async () => {
        const dto = {
            measureAmount: 2,
        } as UpdateInventoryAreaItemDto;

        await expect(areaItemService.update(0, dto)).rejects.toThrow(Error);
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
        await expect(areaItemService.findOne(0)).rejects.toThrow(NotFoundException);
    });

    it('should remove one item by id', async () => {
        const removal = await areaItemService.remove(testId);
        expect(removal).toBeTruthy();

        await expect(areaItemService.findOne(testId)).rejects.toThrow(NotFoundException);
    });

    it('should remove one item by id (not found)', async () => {
        const removal = await areaItemService.remove(testId);
        expect(removal).toBeFalsy();
    });

    // if an inventory item size is deleted, the referencing inv area item count should be deleted
    it('should delete area items when it\'s referenced itemSize is deleted', async () => {
        const items = await areaItemService.findByItemName(FOOD_B, ['countedItemSize']);
        if(!items){ throw new NotFoundException(); }

        const item = items[0];
        
        const removal = await sizeService.remove(item.countedItemSize.id);
        if(!removal){ throw new Error("size removal failed"); }

        await expect(areaItemService.findOne(item.id)).rejects.toThrow(NotFoundException);
    });

    it('should delete area items when it\'s referenced inventoryItem is deleted', async () => {
        const areaItems = await areaItemService.findByItemName(FOOD_C, ['countedItem']);
        if(!areaItems){ throw new NotFoundException(); }

        const areaItem = areaItems[0];
        
        const removal = await itemService.remove(areaItem.countedItem.id);
        if(!removal){ throw new Error("inventory item removal failed"); }

        await expect(areaItemService.findOne(areaItem.id)).rejects.toThrow(NotFoundException);
    });

    // if the count is deleted, the inv area item count should be deleted
    it('should delete area items when it\'s referenced inventoryAreaCount is deleted', async () => {
        const areaItems = await areaItemService.findByItemName(DRY_A, ['parentInventoryCount']);
        if(!areaItems){ throw new NotFoundException(); }
        if(!areaItems[0]){ throw new Error("areaItems is empty"); }

        const areaItem = areaItems[0];
        
        const removal = await countService.remove(areaItem.parentInventoryCount.id);
        if(!removal){ throw new Error("inventory count removal failed"); }

        await expect(areaItemService.findOne(areaItem.id)).rejects.toThrow(NotFoundException);
    });
});