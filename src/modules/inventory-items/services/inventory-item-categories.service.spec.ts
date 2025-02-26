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

  it('should create a inventory item category', async () => {

  })

  it('should update a inventory item category', async () => {
    
  })

  it('should remove a inventory item category', async () => {
    
  })

  it('should get all inventory item categories', async () => {
    
  })

  it('should get a inventory item category by name', async () => {
    
  })

  it('should get inventory item categories from a list of ids', async () => {
    
  })
});
