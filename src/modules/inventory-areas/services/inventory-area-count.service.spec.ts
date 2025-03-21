import { TestingModule } from "@nestjs/testing";
import { InventoryAreaCountFactory } from "../factories/inventory-area-count.factory";
import { AREA_A, AREA_B } from "../utils/constants";
import { getInventoryAreasTestingModule } from "../utils/inventory-areas-testing.module";
import { InventoryAreaCountService } from "./inventory-area-count.service";
import { InventoryAreaService } from "./inventory-area.service";

describe('Inventory area item count service', () => {
    let areaCountService: InventoryAreaCountService;
    let areaCountFactory: InventoryAreaCountFactory;

    let inventoryAreaService: InventoryAreaService;

    let testId: number;
    let testIds: number[];

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();

        areaCountService = module.get<InventoryAreaCountService>(InventoryAreaCountService);
        areaCountFactory = module.get<InventoryAreaCountFactory>(InventoryAreaCountFactory);

        //areas "AREA_[A-D]"
        inventoryAreaService = module.get<InventoryAreaService>(InventoryAreaService);
        await inventoryAreaService.initializeTestingDatabase();
    })

    afterAll(async () => {
        await areaCountService.getQueryBuilder().delete().execute();
    });

    it('should be defined', () => {
        expect(areaCountService).toBeDefined();
    });

    it('should create area count', async () => {
        const areaA = await inventoryAreaService.findOneByName(AREA_A);
        const dto = areaCountFactory.createDtoInstance({ inventoryAreaId: areaA?.id });

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
        const dto = areaCountFactory.createDtoInstance({ });

        //const result = await areaCountService.create(dto);
        //await expect(service.signIn("loginUser", "wrongPassword")).rejects.toThrow(UnauthorizedException);
        await expect(areaCountService.create(dto)).rejects.toThrow(Error);
    });

    it('should THROW ERROR, to create area count (bad areaID)', async () => {
        const dto = areaCountFactory.createDtoInstance({ inventoryAreaId: 10 });
        await expect(areaCountService.create(dto)).rejects.toThrow(Error);
    });

    it('should THROW ERROR, to create area count (has list of itemCountIDs)', async () => {
        const areaA = await inventoryAreaService.findOneByName(AREA_A);
        const dto = areaCountFactory.createDtoInstance({ 
            inventoryAreaId: areaA?.id,
            inventoryItemCountIds: [1, 2, 3, 4]
        });

        const result = await areaCountService.create(dto);
        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull();
    });

    it('should update areaCount\'s area', async () => {
        const newArea = await inventoryAreaService.findOneByName(AREA_B);
        if(!newArea){ throw new Error('new inventoryArea not found'); }

        const toUpdate = await areaCountService.findOne(testId)
        if(!toUpdate){ throw new Error('inventory count to update not found'); }

        //toUpdate.inventoryArea = newArea;
        const result = await areaCountService.update(toUpdate.id, areaCountFactory.updateDtoInstance({
            inventoryAreaId: newArea.id
        }));

        expect(result).not.toBeNull();
        expect(result?.inventoryArea.id).toEqual(newArea.id);
        expect(result?.inventoryArea.name).toEqual(newArea.name);
    });

    it('should remove inventoryCount reference from old inventory Area, and update new One', async () => {
        const oldArea = await inventoryAreaService.findOneByName(AREA_A, ["inventoryCounts"]);
        if(!oldArea){ throw new Error('old inventory area not found'); }
        expect(oldArea?.inventoryCounts).toBeUndefined();

        const newArea = await inventoryAreaService.findOneByName(AREA_B, ["inventoryCounts"]);
        if(!newArea){ throw new Error('new inventoryArea not found'); }
        expect(newArea?.inventoryCounts).not.toBeUndefined();
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

        //toUpdate.inventoryArea = newArea;
        const result = await areaCountService.update(0, areaCountFactory.updateDtoInstance({
            inventoryAreaId: newArea.id
        }));

        expect(result).toBeNull();
    });

    it('should find area counts by area', async () => {
        const results = await areaCountService.findByArea(AREA_A);
        expect(results).not.toBeNull();
        expect(results.length).toEqual(1);
    });

    it('should find area counts by date', async () => {
        const results = await areaCountService.findByDate(new Date());
        expect(results).not.toBeNull();
        expect(results.length).toEqual(4); // area_A, area_b, area_c, area_d

        testIds = [results[0].id, results[1].id, results[2].id];
    });

    it('should get all area counts', async () => {
        const results = await areaCountService.findAll()
        expect(results).not.toBeNull();
        expect(results.length).toEqual(4); // area_A, area_b, area_c, area_d
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
    });
});