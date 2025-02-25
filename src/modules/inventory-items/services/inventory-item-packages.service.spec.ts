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