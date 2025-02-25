import { Test, TestingModule } from "@nestjs/testing";
import { InventoryItemCategoriesController } from "./inventory-item-categories.contoller";

describe('InventoryItemCategoriesController', () => {
  let controller: InventoryItemCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryItemCategoriesController],
    }).compile();

    controller = module.get<InventoryItemCategoriesController>(InventoryItemCategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});