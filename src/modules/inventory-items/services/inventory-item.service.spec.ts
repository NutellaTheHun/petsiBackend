import { TestingModule } from '@nestjs/testing';
import { InventoryItemService } from './inventory-item.service';
import { InventoryItemFactory } from '../factories/inventory-item.factory';
import { getInventoryItemsTestingModule } from '../utils/inventory-items-testing-module';


describe('InventoryItemService', () => {
  let service: InventoryItemService;
  let factory: InventoryItemFactory;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemsTestingModule();

    service = module.get<InventoryItemService>(InventoryItemService);
    factory = module.get<InventoryItemFactory>(InventoryItemFactory);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a inventory item', async () => {

  })

  it('should update a inventory item', async () => {
    
  })

  it('should remove a inventory item', async () => {
    
  })

  it('should get all inventory items', async () => {
    
  })

  it('should get a inventory item by name', async () => {
    
  })

  it('should get inventory items from a list of ids', async () => {
    
  })
});