import { Test, TestingModule } from '@nestjs/testing';
import { UnitCategoryController } from './unit-category.controller';

describe('UnitCategoryController', () => {
  let controller: UnitCategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnitCategoryController],
    }).compile();

    controller = module.get<UnitCategoryController>(UnitCategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
