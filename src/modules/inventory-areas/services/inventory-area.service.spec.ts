import { TestingModule } from "@nestjs/testing";
import { InventoryAreaService } from "./inventory-area.service";
import { InventoryAreaFactory } from "../factories/inventory-area.factory";
import { getInventoryAreasTestingModule } from "../utils/inventory-areas-testing.module";

describe('Inventory area service', () => {
    let service: InventoryAreaService;
    let factory: InventoryAreaFactory;

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();

        service = module.get<InventoryAreaService>(InventoryAreaService);
        factory = module.get<InventoryAreaFactory>(InventoryAreaFactory);
    })

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

});
