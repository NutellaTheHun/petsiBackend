import { Test, TestingModule } from '@nestjs/testing';
import { InventoryAreasService } from './inventory-areas.service';

describe('InventoryAreasService', () => {
  let service: InventoryAreasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventoryAreasService],
    }).compile();

    service = module.get<InventoryAreasService>(InventoryAreasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
