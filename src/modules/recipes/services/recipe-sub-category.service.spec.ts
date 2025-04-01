import { TestingModule } from '@nestjs/testing';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeSubCategoryService } from './recipe-sub-category.service';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { InventoryItemTestingUtil } from '../../inventory-items/utils/inventory-item-testing.util';

describe('recipe sub category service', () => {
  let service: RecipeSubCategoryService;
  let testingUtil: InventoryItemTestingUtil;
  let dbTestContext: DatabaseTestContext;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();
    testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
    dbTestContext = new DatabaseTestContext();

    service = module.get<RecipeSubCategoryService>(RecipeSubCategoryService);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // create
  it('should create a sub-category', async () => {

  });
  // update
  it('should update a sub-category', async () => {

  });
  // findAll
  it('should get all sub-categories', async () => {

  });
  // findOne
  it('should get one sub-category by id', async () => {

  });
  // findEntitiesById
  it('should get sub-categories by a list of ids', async () => {

  });
  // remove
  it('should remove a sub-category', async () => {

  });
  // findOneByName
  it('should get one sub-category by name', async () => {

  });
  // findByCategoryName
  it('should get a list of sub-categories by category name', async () => {

  });
  // findByCategorynameAndSubCategoryName
  it('should get one sub-category with a category name and sub-category name', async () => {

  });
});
