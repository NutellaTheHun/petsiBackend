import { TestingModule } from '@nestjs/testing';
import { getInventoryItemsTestingModule } from '../utils/inventory-items-testing-module';
import { InventoryItemSizeFactory } from '../factories/inventory-item-size.factory';
import { InventoryItemSizeService } from './inventory-item-size.service';


describe('InventoryItemSizeService', () => {
  let service: InventoryItemSizeService;
  let factory: InventoryItemSizeFactory;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemsTestingModule();

    service = module.get<InventoryItemSizeService>(InventoryItemSizeService);
    factory = module.get<InventoryItemSizeFactory>(InventoryItemSizeFactory);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a inventory item size', async () => {

  })

  it('should update a inventory item size', async () => {
    
  })

  it('should remove a inventory item size', async () => {
    
  })

  it('should get all inventory item sizes', async () => {
    
  })

  it('should get a inventory item size by name', async () => {
    
  })

  it('should get inventory item sizes from a list of ids', async () => {
    
  })
});