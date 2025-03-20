import { TestingModule } from "@nestjs/testing";
import { InventoryAreaController } from "./inventory-area.controller";
import { getInventoryAreasTestingModule } from "../utils/inventory-areas-testing.module";

describe('inventory area count controller', () => {
    let controller: InventoryAreaController;

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();

        controller = module.get<InventoryAreaController>(InventoryAreaController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
      });
});