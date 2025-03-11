import { TestingModule } from '@nestjs/testing';
import { InventoryItemService } from './inventory-item.service';
import { InventoryItemFactory } from '../factories/inventory-item.factory';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';


describe('Inventory Item Service', () => {
  let service: InventoryItemService;
  let factory: InventoryItemFactory;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();

    service = module.get<InventoryItemService>(InventoryItemService);
    factory = module.get<InventoryItemFactory>(InventoryItemFactory);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a inventory item', async () => {

  });

  it('should update a inventory item', async () => {
    
  });

  it('should remove a inventory item', async () => {
    
  });

  it('should get all inventory items', async () => {
    
  });

  it('should get a inventory item by name', async () => {
    
  });

  it('should get inventory items from a list of ids', async () => {
    
  });
});