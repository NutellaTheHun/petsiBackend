import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeSubCategoryValidator } from './recipe-sub-category.validator';

describe('recipe sub category validator', () => {
  let testingUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: RecipeSubCategoryValidator;
  let subCategoryRepo: Repository<RecipeSubCategory>;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
    await testingUtil.initRecipeSubCategoryTestingDatabase(dbTestContext);

    validator = module.get<RecipeSubCategoryValidator>(
      RecipeSubCategoryValidator,
    );

    subCategoryRepo = module.get(getRepositoryToken(RecipeSubCategory));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  // Create Validation Tests
  it('successfully validate create: no validation errors', async () => {});

  it('fail validate create: name already exists within parent category', async () => {});

  it('fail validate create: name cannot be the same as the parent category name', async () => {});

  // Update Validation Tests
  it('successfully validate update: no validation errors', async () => {});

  it('fail validate update: name already exists within parent category', async () => {});

  it('fail validate update: name cannot be the same as the parent category name', async () => {});
});
