import { TestingModule } from '@nestjs/testing';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemCategoryService } from './inventory-item-category.service';
import { InventoryItemCategoryFactory } from '../factories/inventory-item-category.factory';
import { InventoryItem } from '../entities/inventory-item.entity';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';

describe('Inventory Item Category Service', () => {
  let service: InventoryItemCategoryService;
  let factory: InventoryItemCategoryFactory;

  const testCategoryName = "testCategoryName";
  let testId: number;
  let testIds: number[];

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();

    service = module.get<InventoryItemCategoryService>(InventoryItemCategoryService);
    factory = module.get<InventoryItemCategoryFactory>(InventoryItemCategoryFactory);
  });

  afterAll(async () => {
    const categoryQueryBuilder = service.getQueryBuilder();
    await categoryQueryBuilder.delete().execute();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a inventory item category', async () => {
    const createCategory = factory.createDtoInstance({ name: testCategoryName });

    const result = await service.create(createCategory);
    
    // for future testing
    testId = result?.id as number;

    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
  });

  it('should update a inventory item category', async () => {
    const updatedName = "UPDATE_NAME";

    const toUpdate = await service.findOne(testId);
    if(!toUpdate) { throw new Error('category to update is null'); }

    toUpdate.name = updatedName;
    const result = await service.update(testId, 
      factory.createDtoInstance({
        name: toUpdate.name,
      })
    );

    expect(result?.name).toEqual(updatedName);
  });

  it('should remove a inventory item category', async () => {
    const removal = await service.remove(testId);
    expect(removal).toBeTruthy();

    const verify = await service.findOne(testId);
    expect(verify).toBeNull();
  });

  it('should insert default item categories and get all categories', async () => {
    const categories = factory.getDefaultItemCategories();
    if(!categories) { throw new Error('default categories is null'); }
    
    for(const category of categories) {
      await service.create(
        factory.createDtoInstance({ name: category.name })
      )
    }

    const results = await service.findAll();

    // for future testing
    testIds = [results[0].id, results[1].id, results[2].id];

    expect(results.length).toEqual(categories.length);
  });

  it('should get a inventory item category by name', async () => {
    const result = await service.findOneByName("cleaning");

    expect(result).not.toBeNull();
    expect(result?.name).toEqual("cleaning");
  });

  it('should get inventory item categories from a list of ids', async () => {
    const results = await service.findEntitiesById(testIds);

    expect(results.length).toEqual(testIds.length);

    for(const result of results){
      expect(testIds.find(id => result.id)).toBeTruthy();
    }
  });
});
