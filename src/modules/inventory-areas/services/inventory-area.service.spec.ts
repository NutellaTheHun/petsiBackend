import { NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { AppHttpException } from "../../../util/exceptions/app-http-exception";
import { CreateInventoryAreaDto } from "../dto/inventory-area/create-inventory-area.dto";
import { UpdateInventoryAreaDto } from "../dto/inventory-area/update-inventory-area.dto";
import { InventoryAreaTestUtil } from "../utils/inventory-area-test.util";
import { getInventoryAreasTestingModule } from "../utils/inventory-areas-testing.module";
import { InventoryAreaService } from "./inventory-area.service";
import { ValidationException } from "../../../util/exceptions/validation-exception";
import { DatabaseException } from "../../../util/exceptions/database-exception";

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
        const area = { areaName: testAreaName } as CreateInventoryAreaDto;
        const result = await service.create(area);

        expect(result).not.toBeNull();

        if (!result?.id) { throw new Error('created area id is null'); }
        testId = result?.id;
    });

    it('should fail to create an area (already exists)', async () => {
        const area = { areaName: testAreaName } as CreateInventoryAreaDto;

        await expect(service.create(area)).rejects.toThrow(ValidationException);
    });

    it('should update an area', async () => {
        const toUpdate = { areaName: updateTestAreaName } as UpdateInventoryAreaDto;

        const result = await service.update(testId, toUpdate);

        expect(result).not.toBeNull();
        expect(result?.id).toEqual(testId);
        expect(result?.areaName).toEqual(updateTestAreaName);
    });

    it('should fail to update an area (doesnt exist)', async () => {
        const toUpdate = { areaName: updateTestAreaName } as UpdateInventoryAreaDto;

        await expect(service.update(0, toUpdate)).rejects.toThrow(DatabaseException);
    });

    it('should find one by name', async () => {
        const result = await service.findOneByName(updateTestAreaName);

        expect(result).not.toBeNull();
        expect(result?.id).toEqual(testId);
        expect(result?.areaName).toEqual(updateTestAreaName);
    });


    it('should remove Area', async () => {
        const result = await service.remove(testId);
        expect(result).toBeTruthy();

        await expect(service.findOne(testId)).rejects.toThrow(NotFoundException);
    });

    it('should get ALL areas', async () => {
        const testAreas = await testingUtil.getTestInventoryAreaEntities(dbTestContext);

        const results = await service.findAll();
        expect(results.items.length).toEqual(testAreas.length);

        testIds = [results.items[0].id, results.items[1].id, results.items[2].id];
    });

    it('should get a list of areas by IDs', async () => {
        const results = await service.findEntitiesById(testIds);

        expect(results.length).toBeGreaterThan(0);
        expect(results.length).toEqual(testIds.length);
    });
});
