import { TestingModule } from "@nestjs/testing";
import { getInventoryAreasTestingModule } from "../utils/inventory-areas-testing.module";
import { InventoryAreaService } from "./inventory-area.service";
import { CreateInventoryAreaDto } from "../dto/create-inventory-area.dto";
import { UpdateInventoryAreaDto } from "../dto/update-inventory-area.dto";
import { InventoryAreaTestUtil } from "../utils/inventory-area-test.util";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { BadRequestException } from "@nestjs/common";

describe('Inventory area service', () => {
    let testingUtil: InventoryAreaTestUtil;
    let dbTestContext: DatabaseTestContext;
    let service: InventoryAreaService;

    const testAreaName = "testAreaName";
    const updateTestAreaName = "UPDATED_TEST_AREA";
    let testId: number;
    let testIds: number[];

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();
        
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
        await testingUtil.initInventoryAreaTestDatabase(dbTestContext);

        service = module.get<InventoryAreaService>(InventoryAreaService);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create an area', async () => {
        const area = { name: testAreaName } as CreateInventoryAreaDto;
        const result = await service.create(area);
        
        expect(result).not.toBeNull();

        if(!result?.id){ throw new Error('created area id is null'); }
        testId = result?.id;
    });

    it('should fail to create an area (already exists)', async () => {
        const area = { name: testAreaName } as CreateInventoryAreaDto;
        const result = await service.create(area);

        expect(result).rejects.toThrow(BadRequestException);
    });

    it('should update an area', async () => {
        const toUpdate = { name: updateTestAreaName } as UpdateInventoryAreaDto;

        const result = await service.update(testId, toUpdate);

        expect(result).not.toBeNull();
        expect(result?.id).toEqual(testId);
        expect(result?.name).toEqual(updateTestAreaName);
    });

    it('should fail to update an area (doesnt exist)', async () => {
        const toUpdate = { name: updateTestAreaName } as UpdateInventoryAreaDto;

        const result = await service.update(0, toUpdate);

        expect(result).toBeNull();
    });

    it('should find one by name', async () => {
        const result = await service.findOneByName(updateTestAreaName);

        expect(result).not.toBeNull();
        expect(result?.id).toEqual(testId);
        expect(result?.name).toEqual(updateTestAreaName);
    });


    it('should remove Area', async () => {
        const result = await service.remove(testId);
        expect(result).toBeTruthy();

        const verify = await service.findOne(testId);
        expect(verify).toBeNull();
    });

    it('should get ALL areas', async () => {
        const testAreas = await testingUtil.getTestInventoryAreaEntities(dbTestContext);

        const results = await service.findAll();
        expect(results.items.length).toEqual(testAreas.length);

        testIds = [ results.items[0].id, results.items[1].id, results.items[2].id ];
    });

    it('should get a list of areas by IDs', async () => {
        const results = await service.findEntitiesById(testIds); 

        expect(results.length).toBeGreaterThan(0);
        expect(results.length).toEqual(testIds.length);
    });
});
