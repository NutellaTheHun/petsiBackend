import { TestingModule } from "@nestjs/testing";
import { getInventoryAreasTestingModule } from "../utils/inventory-areas-testing.module";
import { InventoryAreaController } from "./inventory-area.controller";

describe('inventory area controller', () => {
    let controller: InventoryAreaController;
    
    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();

        controller = module.get<InventoryAreaController>(InventoryAreaController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});