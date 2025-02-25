import { Test, TestingModule } from '@nestjs/testing';
import { InventoryItemsService } from './inventory-items.service';
import { InventoryItemFactory } from '../factories/inventory-item.factory';
import { getInventoryItemsTestingModule } from '../utils/inventory-items-testing-module';


describe('InventoryItemsService', () => {
  let service: InventoryItemsService;
  let factory: InventoryItemFactory;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemsTestingModule();

    service = module.get<InventoryItemsService>(InventoryItemsService);
    factory = module.get<InventoryItemFactory>(InventoryItemFactory);
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