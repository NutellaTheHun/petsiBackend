import { TestingModule } from "@nestjs/testing";
import { InventoryAreaItemCountService } from "./inventory-area-item-count.service";
import { InventoryAreaItemCountFactory } from "../factories/inventory-area-item-count.factory";
import { getInventoryAreasTestingModule } from "../utils/inventory-areas-testing.module";

describe('Inventory area item count service', () => {
    let service: InventoryAreaItemCountService;
    let factory: InventoryAreaItemCountFactory;

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();

        service = module.get<InventoryAreaItemCountService>(InventoryAreaItemCountService);
        factory = module.get<InventoryAreaItemCountFactory>(InventoryAreaItemCountFactory);
    })

    afterAll(async () => {
        await service.getQueryBuilder().delete().execute();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create an itemCount', async () => {

    });

    it('should fail to create an itemCount (already exists)', async () => {

    });

    it('should fail to create an itemCount (no itemSize info)', async () => {

    });

    it('should fail to create an itemCount (has both itemSizeId AND itemSizeDto)', async () => {

    });

    it('should update itemCount', async () => {
        // new area

        // new areaCount

        // new Item

        // new unitAmount

        // new measureAmount

        // new Size (by sizeId)

        // new size (by sizeDto)
    });

    it('should fail to update an itemCount (doesnt exist)', async () => {

    });

    it('should fail to update an itemCount (no itemSize info)', async () => {

    });

    it('should fail to update an itemCount (has both itemSizeId AND itemSizeDto)', async () => {

    });

    it('should find by area name', async () => {

    });

    it('should find by item name', async () => {

    });

    it('should find all itemCounts', async () => {

    });

    it('should remove itemCount', async () => {

    });

    it('should find itemCounts by list of IDs', async () => {

    });
});