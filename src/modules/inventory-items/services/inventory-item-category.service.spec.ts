import { TestingModule } from '@nestjs/testing';
import { CreateInventoryItemCategoryDto } from '../dto/create-inventory-item-category.dto';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemCategoryService } from './inventory-item-category.service';
import { UpdateInventoryItemCategoryDto } from '../dto/update-inventory-item-category.dto';

describe('Inventory Item Category Service', () => {
  let testingUtil: InventoryItemTestingUtil;
  let service: InventoryItemCategoryService;

  const testCategoryName = "testCategoryName";
  let testId: number;
  let testIds: number[];

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();
    testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);

    service = module.get<InventoryItemCategoryService>(InventoryItemCategoryService);
  });

  afterAll(async () => {
    const categoryQueryBuilder = service.getQueryBuilder();
    await categoryQueryBuilder.delete().execute();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a inventory item category', async () => {
    const createCategory = { name: testCategoryName } as CreateInventoryItemCategoryDto;

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
    const result = await service.update(
      testId, 
      { name: toUpdate.name } as UpdateInventoryItemCategoryDto
    );

    expect(result?.name).toEqual(updatedName);
  });

  it('should remove a inventory item category', async () => {
    const removal = await service.remove(testId);
    expect(removal).toBeTruthy();

    const verify = await service.findOne(testId);
    expect(verify).toBeNull();
  });

  it('should insert testing item categories and get all categories', async () => {
    const categories = testingUtil.getTestInventoryItemCategoryEntities();
    await testingUtil.initializeInventoryItemCategoryDatabaseTesting();

    const results = await service.findAll();

    // for future testing
    testIds = [results[0].id, results[1].id, results[2].id];

    expect(results.length).toEqual(categories.length);
  });

  it('should get a inventory item category by name', async () => {
    const result = await service.findOneByName("food");

    expect(result).not.toBeNull();
    expect(result?.name).toEqual("food");
  });

  it('should get inventory item categories from a list of ids', async () => {
    const results = await service.findEntitiesById(testIds);

    expect(results.length).toEqual(testIds.length);

    for(const result of results){
      expect(testIds.find(id => result.id)).toBeTruthy();
    }
  });
});
