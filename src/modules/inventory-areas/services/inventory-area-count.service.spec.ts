import { TestingModule } from "@nestjs/testing";
import { InventoryAreaCountService } from "./inventory-area-count.service";
import { InventoryAreaCountFactory } from "../factories/inventory-area-count.factory";
import { getInventoryAreasTestingModule } from "../utils/inventory-areas-testing.module";

describe('Inventory area item count service', () => {
    let service: InventoryAreaCountService;
    let factory: InventoryAreaCountFactory;

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();

        service = module.get<InventoryAreaCountService>(InventoryAreaCountService);
        factory = module.get<InventoryAreaCountFactory>(InventoryAreaCountFactory);
    })

    afterAll(async () => {
        await service.getQueryBuilder().delete().execute();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create area count (no counted items)', async () => {

    });

    it('should create area count (with counted items)', async () => {

    });

    it('should update area count', async () => {
        // update area

        // update items
    });

    it('should fail to update area count (doesnt exist)', async () => {

    });

    it('should find area counts by area', async () => {

    });

    it('should find area counts by date', async () => {

    });

    it('should remove area count', async () => {

    });

    it('should get all area counts', async () => {

    });
    it('should get area counts by id', async () => {

    });
});