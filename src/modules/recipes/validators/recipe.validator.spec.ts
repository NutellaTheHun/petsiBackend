import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { Recipe } from '../entities/recipe.entity';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeValidator } from './recipe.valdiator';

describe('recipe validator', () => {
  let testingUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: RecipeValidator;

  let recipeRepo: Repository<Recipe>;
  let categoryRepo: Repository<RecipeCategory>;
  let subCategoryRepo: Repository<RecipeSubCategory>;
  let ingredientRepo: Repository<RecipeIngredient>;
  let unitOfMeasureRepo: Repository<UnitOfMeasure>;
  let inventoryItemRepo: Repository<InventoryItem>;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
    await testingUtil.initRecipeIngredientTestingDatabase(dbTestContext);

    validator = module.get<RecipeValidator>(RecipeValidator);

    recipeRepo = module.get(getRepositoryToken(Recipe));
    categoryRepo = module.get(getRepositoryToken(RecipeCategory));
    subCategoryRepo = module.get(getRepositoryToken(RecipeSubCategory));
    ingredientRepo = module.get(getRepositoryToken(RecipeIngredient));
    unitOfMeasureRepo = module.get(getRepositoryToken(UnitOfMeasure));
    inventoryItemRepo = module.get(getRepositoryToken(InventoryItem));
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

  it('fail validate create: requires category if assigning sub-category', async () => {});

  it('fail validate create: invalid category / subcategory combination', async () => {});

  it('fail validate create: batchResultUnitTypeId and batchResultQuantity must both be populated', async () => {});

  it('fail validate create: servingSizeQuantity and servingSizeUnitTypeId must both be populated', async () => {});

  it('fail validate create: serving size quantity cannot be 0', async () => {});

  it('fail validate create: batch result quantity cannot be 0', async () => {});

  it('fail validate create: sales price cannot be 0', async () => {});

  it('fail validate create: duplicate ingredients', async () => {});

  it('fail validate create: nested ingredients validator errors: missing reference for ingredient', async () => {});

  it('fail validate create: nested ingredients validator errors: cannot provide both an inventory item and a recipe as an ingredient', async () => {});

  it('fail validate create: recipeIngredient isIngredient is false', async () => {});

  it('fail validate create: nested ingredients validator errors: quantity cannot be 0', async () => {});

  // Update Validation Tests
  it('successfully validate update: no validation errors', async () => {});

  it('fail validate update: name already exists', async () => {});

  it('fail validate update: requires category if assigning sub-category', async () => {});

  it('fail validate update: invalid category / subcategory combination', async () => {});

  it('fail validate update: batchResultUnitTypeId and batchResultQuantity must both be populated', async () => {});

  it('fail validate update: batch result quantity cannot be 0', async () => {});

  it('fail validate update: sales price cannot be 0', async () => {});

  it('fail validate update: duplicate ingredients', async () => {});

  it('fail validate update: nested ingredients validator errors: missing reference for ingredient', async () => {});

  it('fail validate update: nested ingredients validator errors: cannot provide both an inventory item and a recipe as an ingredient', async () => {});

  it('fail validate update: nested ingredients validator errors: quantity cannot be 0', async () => {});

  it('fail validate update: recipeIngredient isIngredient is false', async () => {});

  it('fail validate update: nested ingredients validator errors: recipe cannot add itself as an ingredient', async () => {});
});
