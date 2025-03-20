import { TestingModule } from "@nestjs/testing";
import { getInventoryAreasTestingModule } from "../utils/inventory-areas-testing.module";
import { InventoryAreaItemCountController } from "./inventory-area-item-count.controller";

describe('inventory area item count controller', () => {
    let controller: InventoryAreaItemCountController;
    
    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();

        controller = module.get<InventoryAreaItemCountController>(InventoryAreaItemCountController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
      });
});