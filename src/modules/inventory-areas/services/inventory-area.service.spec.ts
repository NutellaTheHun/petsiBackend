import { TestingModule } from "@nestjs/testing";
import { InventoryAreaFactory } from "../factories/inventory-area.factory";
import { getInventoryAreasTestingModule } from "../utils/inventory-areas-testing.module";
import { InventoryAreaService } from "./inventory-area.service";

describe('Inventory area service', () => {
    let service: InventoryAreaService;
    let factory: InventoryAreaFactory;

    const testAreaName = "testAreaName";
    const updateTestAreaName = "UPDATED_TEST_AREA";
    let testId: number;
    let testIds: number[];

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();

        service = module.get<InventoryAreaService>(InventoryAreaService);
        factory = module.get<InventoryAreaFactory>(InventoryAreaFactory);
    });

    afterAll(async () => {
        await service.getQueryBuilder().delete().execute();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create an area', async () => {
        const area = factory.createDtoInstance({ name: testAreaName });
        const result = await service.create(area);
        
        expect(result).not.toBeNull();

        if(!result?.id){ throw new Error('created area id is null'); }
        testId = result?.id;
    });

    it('should fail to create an area (already exists)', async () => {
        const area = factory.createDtoInstance({ name: testAreaName });
        const result = await service.create(area);

        expect(result).toBeNull();
    });

    it('should update an area', async () => {
        const toUpdate = factory.updateDtoInstance({});

        const result = await service.update(testId, toUpdate);

        expect(result).not.toBeNull();
        expect(result?.id).toEqual(testId);
        expect(result?.name).toEqual(updateTestAreaName);
    });

    it('should fail to update an area (doesnt exist)', async () => {
        const toUpdate = factory.updateDtoInstance({
            name: updateTestAreaName,
        });

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
        const testAreas = factory.getTestingAreas();
        for(const area of testAreas){
            await service.create(
                factory.createDtoInstance({
                    name: area.name
                })
            )
        }

        const results = await service.findAll();
        expect(results.length).toEqual(testAreas.length);

        testIds = [ results[0].id, results[1].id, results[2].id ];
    });

    it('should get a list of areas by IDs', async () => {
        const results = await service.findEntitiesById(testIds); 

        expect(results.length).toBeGreaterThan(0);
        expect(results.length).toEqual(testIds.length);
    });
});
