import { TestingModule } from '@nestjs/testing';
import { getInventoryItemsTestingModule } from '../utils/inventory-items-testing-module';
import { InventoryItemCategoriesService } from './inventory-items-categories.service';
import { InventoryItemCategoryFactory } from '../factories/inventory-item-category.factory';


describe('InventoryItemCategoriesService', () => {
  let service: InventoryItemCategoriesService;
  let factory: InventoryItemCategoryFactory;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemsTestingModule();

    service = module.get<InventoryItemCategoriesService>(InventoryItemCategoriesService);
    factory = module.get<InventoryItemCategoryFactory>(InventoryItemCategoryFactory);
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
