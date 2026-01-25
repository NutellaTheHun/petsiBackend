import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { Recipe } from '../entities/recipe.entity';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeIngredientValidator } from './recipe-ingredient.validator';

describe('recipe ingredient validator', () => {
  let testingUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: RecipeIngredientValidator;

  let ingredientRepo: Repository<RecipeIngredient>;
  let inventoryItemRepo: Repository<InventoryItem>;
  let recipeRepo: Repository<Recipe>;
  let unitOfMeasureRepo: Repository<UnitOfMeasure>;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
    await testingUtil.initRecipeIngredientTestingDatabase(dbTestContext);

    validator = module.get<RecipeIngredientValidator>(
      RecipeIngredientValidator,
    );

    ingredientRepo = module.get(getRepositoryToken(RecipeIngredient));
    inventoryItemRepo = module.get(getRepositoryToken(InventoryItem));
    recipeRepo = module.get(getRepositoryToken(Recipe));
    unitOfMeasureRepo = module.get(getRepositoryToken(UnitOfMeasure));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  // Create Validation Tests
  it('successfully validate create: no validation errors', async () => {});

  it('fail validate create: missing reference for ingredient', async () => {});

  it('fail validate create: cannot provide both an inventory item and a recipe as an ingredient', async () => {});

  it('fail validate create: quantity cannot be 0', async () => {});

  // Update Validation Tests
  it('successfully validate update: no validation errors', async () => {});

  it('fail validate update: missing reference for ingredient', async () => {});

  it('fail validate update: cannot provide both an inventory item and a recipe as an ingredient', async () => {});

  it('fail validate update: quantity cannot be 0', async () => {});

  it('fail validate update: recipe cannot add itself as an ingredient', async () => {});
});
