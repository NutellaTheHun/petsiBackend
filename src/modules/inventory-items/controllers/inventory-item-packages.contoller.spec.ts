import { Test, TestingModule } from "@nestjs/testing";
import { InventoryItemCategoriesController } from "./inventory-item-categories.contoller";
import { InventoryItemPackagesController } from "./inventory-item-packages.contoller";

describe('InventoryItemPackagesController', () => {
  let controller: InventoryItemPackagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryItemPackagesController],
    }).compile();

    controller = module.get<InventoryItemPackagesController>(InventoryItemPackagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});