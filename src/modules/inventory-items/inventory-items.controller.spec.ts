import { Test, TestingModule } from '@nestjs/testing';
import { InventoryItemsController } from './inventory-items.controller';

describe('InventoryItemsController', () => {
  let controller: InventoryItemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryItemsController],
    }).compile();

    controller = module.get<InventoryItemsController>(InventoryItemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
