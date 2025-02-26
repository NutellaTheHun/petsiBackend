import { Test, TestingModule } from '@nestjs/testing';
import { UnitCategoryService } from './unit-category.service';


describe('UnitCategoryService', () => {
  let service: UnitCategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UnitCategoryService],
    }).compile();

    service = module.get<UnitCategoryService>(UnitCategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
