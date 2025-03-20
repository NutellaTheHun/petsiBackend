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

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});