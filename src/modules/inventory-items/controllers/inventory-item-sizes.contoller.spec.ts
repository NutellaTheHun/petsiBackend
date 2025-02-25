import { Test, TestingModule } from "@nestjs/testing";
import { InventoryItemSizesController } from "./inventory-item-sizes.contoller";

describe('InventoryItemSizesController', () => {
  let controller: InventoryItemSizesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryItemSizesController],
    }).compile();

    controller = module.get<InventoryItemSizesController>(InventoryItemSizesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});