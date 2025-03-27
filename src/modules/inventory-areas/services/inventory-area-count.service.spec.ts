import { TestingModule } from "@nestjs/testing";
import { AREA_A, AREA_B } from "../utils/constants";
import { getInventoryAreasTestingModule } from "../utils/inventory-areas-testing.module";
import { InventoryAreaCountService } from "./inventory-area-count.service";
import { InventoryAreaService } from "./inventory-area.service";
import { InventoryAreaTestUtil } from "../utils/inventory-area-test.util";
import { CreateInventoryAreaCountDto } from "../dto/create-inventory-area-count.dto";
import { UpdateInventoryAreaCountDto } from "../dto/update-inventory-area-count.dto";

describe('Inventory area item count service', () => {
    let testingUtil: InventoryAreaTestUtil;
    let areaCountService: InventoryAreaCountService;

    let inventoryAreaService: InventoryAreaService;

    let testId: number;
    let testIds: number[];

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();

        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
        await testingUtil.initializeInventoryAreaDatabaseTesting();

        areaCountService = module.get<InventoryAreaCountService>(InventoryAreaCountService);
        inventoryAreaService = module.get<InventoryAreaService>(InventoryAreaService);
    })

    afterAll(async () => {
        await areaCountService.getQueryBuilder().delete().execute();

        await inventoryAreaService.getQueryBuilder().delete().execute();
    });

    it('should be defined', () => {
        expect(areaCountService).toBeDefined();
    });

    it('should create area count', async () => {
        const areaA = await inventoryAreaService.findOneByName(AREA_A);
        const dto = { inventoryAreaId: areaA?.id } as CreateInventoryAreaCountDto;

        const result = await areaCountService.create(dto);
        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull();

        if(result?.id){ testId = result?.id; }
    });

    it('should update inventoryArea\'s list of areaCounts', async () => {
        const areaA = await inventoryAreaService.findOneByName(AREA_A, ["inventoryCounts"]);
        if(!areaA){ throw new Error('inventory area not found'); }

        expect(areaA?.inventoryCounts).not.toBeUndefined();
        expect(areaA?.inventoryCounts.length).toEqual(1);
    });

    it('should THROW ERROR, to create area count (no areaID)', async () => {
        const dto = { } as CreateInventoryAreaCountDto;

        await expect(areaCountService.create(dto)).rejects.toThrow(Error);
    });

    it('should THROW ERROR, to create area count (bad areaID)', async () => {
        const dto = { inventoryAreaId: 10 } as CreateInventoryAreaCountDto;
        await expect(areaCountService.create(dto)).rejects.toThrow(Error);
    });

    it('should THROW ERROR, to create area count (has list of itemCountIDs)', async () => {
        const areaA = await inventoryAreaService.findOneByName(AREA_A);
        const dto = { 
            inventoryAreaId: areaA?.id,
            inventoryItemCountIds: [1, 2, 3, 4]
        } as CreateInventoryAreaCountDto;

        await expect(areaCountService.create(dto)).rejects.toThrow(Error);
    });

    it('should update areaCount\'s area', async () => {
        const newArea = await inventoryAreaService.findOneByName(AREA_B);
        if(!newArea){ throw new Error('new inventoryArea not found'); }

        const toUpdate = await areaCountService.findOne(testId)
        if(!toUpdate){ throw new Error('inventory count to update not found'); }

        const result = await areaCountService.update(
            toUpdate.id, 
            { inventoryAreaId: newArea.id } as UpdateInventoryAreaCountDto,
        );

        expect(result).not.toBeNull();
        expect(result?.inventoryArea.id).toEqual(newArea.id);
        expect(result?.inventoryArea.name).toEqual(newArea.name);
    });

    it('should remove inventoryCount reference from old inventory Area, and update new one', async () => {
        const oldArea = await inventoryAreaService.findOneByName(AREA_A, ["inventoryCounts"]);
        if(!oldArea){ throw new Error('old inventory area not found'); }
        expect(oldArea?.inventoryCounts.length).toEqual(0);

        const newArea = await inventoryAreaService.findOneByName(AREA_B, ["inventoryCounts"]);
        if(!newArea){ throw new Error('new inventoryArea not found'); }
        expect(newArea?.inventoryCounts).not.toBeNull();
        expect(newArea?.inventoryCounts.length).toEqual(1);
        expect(newArea?.inventoryCounts[0].id).toEqual(testId);
    });

    it('should update areaCount\'s countedItems', async () => {
        
    });

    it('should fail to update area count (doesnt exist)', async () => {
        const newArea = await inventoryAreaService.findOneByName(AREA_B);
        if(!newArea){ throw new Error('new inventoryArea not found'); }

        const toUpdate = await areaCountService.findOne(testId)
        if(!toUpdate){ throw new Error('inventory count to update not found'); }

        const result = await areaCountService.update(
            0, 
            { inventoryAreaId: newArea.id } as UpdateInventoryAreaCountDto
        );

        expect(result).toBeNull();
    });

    it('should find area counts by area', async () => {
        const results = await areaCountService.findByAreaName(AREA_B);
        expect(results).not.toBeNull();
        expect(results.length).toEqual(1);
    });

    it('should find area counts by date', async () => {
        const results = await areaCountService.findByDate(new Date());
        expect(results).not.toBeNull();
        expect(results.length).toEqual(1);

        testIds = [results[0].id];
    });

    it('should get all area counts', async () => {
        const results = await areaCountService.findAll()
        expect(results).not.toBeNull();
        expect(results.length).toEqual(1);
    });

    it('should get area counts by id', async () => {
        const results = await areaCountService.findEntitiesById(testIds);

        expect(results).not.toBeNull();
        expect(results.length).toEqual(testIds.length);
        for(const result of results){
            expect(testIds.find(id => result.id)).toBeTruthy();
        }
    });

    it('should remove area count', async () => {
        const result = await areaCountService.remove(testId);
        expect(result).toBeTruthy();

        const verify = await areaCountService.findOne(testId);
        expect(verify).toBeNull();

        const area = await inventoryAreaService.findOneByName(AREA_B, ["inventoryCounts"]);
        expect(area?.inventoryCounts.length).toEqual(0);
    });
});