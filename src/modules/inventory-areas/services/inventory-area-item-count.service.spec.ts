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

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

});