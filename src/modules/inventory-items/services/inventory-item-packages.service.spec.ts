import { TestingModule } from '@nestjs/testing';
import { InventoryItemFactory } from '../factories/inventory-item.factory';
import { getInventoryItemsTestingModule } from '../utils/inventory-items-testing-module';
import { InventoryItemPackagesService } from './inventory-items-packages.service';


describe('InventoryItemPackagesService', () => {
  let service: InventoryItemPackagesService;
  let factory: InventoryItemFactory;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemsTestingModule();

    service = module.get<InventoryItemPackagesService>(InventoryItemPackagesService);
    factory = module.get<InventoryItemFactory>(InventoryItemFactory);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a inventory item package', async () => {

  })

  it('should update a inventory item package', async () => {
    
  })

  it('should remove a inventory item package', async () => {
    
  })

  it('should get all inventory item packages', async () => {
    
  })

  it('should get a inventory item package by name', async () => {
    
  })

  it('should get inventory item packages from a list of ids', async () => {
    
  })
});