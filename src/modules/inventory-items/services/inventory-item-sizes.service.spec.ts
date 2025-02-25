import { TestingModule } from '@nestjs/testing';
import { getInventoryItemsTestingModule } from '../utils/inventory-items-testing-module';
import { InventoryItemSizeFactory } from '../factories/inventory-item-size.factory';
import { InventoryItemSizesService } from './inventory-items-sizes.service';


describe('InventoryItemSizesService', () => {
  let service: InventoryItemSizesService;
  let factory: InventoryItemSizeFactory;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemsTestingModule();

    service = module.get<InventoryItemSizesService>(InventoryItemSizesService);
    factory = module.get<InventoryItemSizeFactory>(InventoryItemSizeFactory);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a ___', async () => {

  })

  it('should update a ___', async () => {
    
  })

  it('should remove a ___', async () => {
    
  })

  it('should get all ___', async () => {
    
  })

  it('should get by name ___', async () => {
    
  })

  it('should get from a list of ___ ids', async () => {
    
  })
});