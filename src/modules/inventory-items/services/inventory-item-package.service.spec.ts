import { TestingModule } from '@nestjs/testing';
import { getInventoryItemsTestingModule } from '../utils/inventory-items-testing-module';
import { InventoryItemPackageService } from './inventory-item-package.service';
import { InventoryItemPackageFactory } from '../factories/inventory-item-package.factory';
import { InventoryItemService } from './inventory-item.service';


describe('InventoryItemPackageService', () => {
  let packageService: InventoryItemPackageService;
  let packageFactory: InventoryItemPackageFactory;

  let itemService: InventoryItemService;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemsTestingModule();

    packageService = module.get<InventoryItemPackageService>(InventoryItemPackageService);
    packageFactory = module.get<InventoryItemPackageFactory>(InventoryItemPackageFactory);

    itemService = module.get<InventoryItemService>(InventoryItemService);
  });

  it('should be defined', () => {
    expect(packageService).toBeDefined();
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