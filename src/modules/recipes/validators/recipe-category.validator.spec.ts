import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeCategoryValidator } from './recipe-category.validator';

describe('recipe category validator', () => {
  let testingUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: RecipeCategoryValidator;
  let categoryRepo: Repository<RecipeCategory>;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
    await testingUtil.initRecipeSubCategoryTestingDatabase(dbTestContext);

    validator = module.get<RecipeCategoryValidator>(RecipeCategoryValidator);

    categoryRepo = module.get(getRepositoryToken(RecipeCategory));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  // Create Validation Tests
  it('successfully validate create: no validation errors', async () => {});

  it('fail validate create: name already exists', async () => {});

  it('fail validate create: duplicate sub categories', async () => {});

  it('fail validate create: nested subCategories validator errors: name already exists', async () => {});

  // Update Validation Tests
  it('successfully validate update: no validation errors', async () => {});

  it('fail validate update: name already exists', async () => {});

  it('fail validate update: duplicate sub categories', async () => {});

  it('fail validate update: nested subCategories validator errors: name already exists', async () => {});
});
