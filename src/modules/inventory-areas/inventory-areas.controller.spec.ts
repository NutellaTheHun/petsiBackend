import { Test, TestingModule } from '@nestjs/testing';
import { InventoryAreasController } from './inventory-areas.controller';

describe('InventoryAreasController', () => {
  let controller: InventoryAreasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryAreasController],
    }).compile();

    controller = module.get<InventoryAreasController>(InventoryAreasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
