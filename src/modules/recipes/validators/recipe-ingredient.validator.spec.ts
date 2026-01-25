import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { FOOD_A } from '../../inventory-items/utils/constants';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { POUND } from '../../unit-of-measure/utils/constants';
import { CreateRecipeIngredientDto } from '../dto/recipe-ingredient/create-recipe-ingredient.dto';
import { UpdateRecipeIngredientDto } from '../dto/recipe-ingredient/update-recipe-ingedient.dto';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { Recipe } from '../entities/recipe.entity';
import { REC_A } from '../utils/constants';
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

  it('should validate create with recipe ingredient', async () => {
    const recipe = await recipeService.findOneByName(REC_A);
    if (!recipe) {
      throw new Error();
    }

    const measurement = await measureService.findOneByName(POUND);
    if (!measurement) {
      throw new Error();
    }

    const dto = {
      ingredientRecipeId: recipe.id,
      quantity: 1,
      quantityUnitTypeId: measurement.id,
    } as CreateRecipeIngredientDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should validate create with inventoryItem ingredient', async () => {
    const inventoryItem = await inventoryService.findOneByName(FOOD_A);
    if (!inventoryItem) {
      throw new Error();
    }

    const measurement = await measureService.findOneByName(POUND);
    if (!measurement) {
      throw new Error();
    }

    const dto = {
      ingredientInventoryItemId: inventoryItem.id,
      quantity: 1,
      quantityUnitTypeId: measurement.id,
    } as CreateRecipeIngredientDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should fail create: neither recipe or inventory item ingredient', async () => {
    const measurement = await measureService.findOneByName(POUND);
    if (!measurement) {
      throw new Error();
    }

    const dto = {
      quantity: 1,
      quantityUnitTypeId: measurement.id,
    } as CreateRecipeIngredientDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('ingredientInventoryItem');
  });

  it('should pass update with RECIPE ingredient => RECIPE ingredient', async () => {
    const toUpdate = (
      await ingredientService.findAll({ relations: ['ingredientRecipe'] })
    ).items;
    if (!toUpdate) {
      throw new Error();
    }

    const ingredsWRecipes = toUpdate.filter(
      (ingred) => ingred.ingredientRecipe,
    );

    const newRecipe = await recipeService.findOneByName(REC_A);
    if (!newRecipe) {
      throw new Error();
    }

    const measurement = await measureService.findOneByName(POUND);
    if (!measurement) {
      throw new Error();
    }

    const dto = {
      id: ingredsWRecipes[0].id,
      ingredientRecipeId: newRecipe.id,
      quantity: 1,
      quantityUnitTypeId: measurement.id,
    } as UpdateRecipeIngredientDto;

    const result = await validator.validateUpdateNode(
      'root',
      dto,
      ingredsWRecipes[0].id,
    );
    expect(result).toBeNull();
  });

  it('should pass update with RECIPE ingredient => INVENTORY item ingredient', async () => {
    const toUpdate = (
      await ingredientService.findAll({ relations: ['ingredientRecipe'] })
    ).items;
    if (!toUpdate) {
      throw new Error();
    }

    const ingredsWRecipes = toUpdate.filter(
      (ingred) => ingred.ingredientRecipe,
    );

    const newInventoryItem = await inventoryService.findOneByName(FOOD_A);
    if (!newInventoryItem) {
      throw new Error();
    }

    const measurement = await measureService.findOneByName(POUND);
    if (!measurement) {
      throw new Error();
    }

    const dto = {
      mode: 'update',
      id: ingredsWRecipes[0].id,
      ingredientRecipeId: null,
      ingredientInventoryItemId: newInventoryItem.id,
      quantity: 1,
      quantityUnitTypeId: measurement.id,
    } as UpdateRecipeIngredientDto;

    const result = await validator.validateUpdateNode(
      'root',
      dto,
      ingredsWRecipes[0].id,
    );
    expect(result).toBeNull();
  });

  it('should pass update with INVENTORY item ingredient => RECIPE ingredient', async () => {
    const toUpdate = (
      await ingredientService.findAll({
        relations: ['ingredientInventoryItem'],
      })
    ).items;
    if (!toUpdate) {
      throw new Error();
    }

    const ingredsWItems = toUpdate.filter(
      (ingred) => ingred.ingredientInventoryItem,
    );

    const newRecipe = await recipeService.findOneByName(REC_A);
    if (!newRecipe) {
      throw new Error();
    }

    const measurement = await measureService.findOneByName(POUND);
    if (!measurement) {
      throw new Error();
    }

    const dto = {
      id: ingredsWItems[0].id,
      ingredientRecipeId: newRecipe.id,
      ingredientInventoryItemId: null,
      quantity: 1,
      quantityUnitTypeId: measurement.id,
    } as UpdateRecipeIngredientDto;

    const result = await validator.validateUpdateNode(
      'root',
      dto,
      ingredsWItems[0].id,
    );
    expect(result).toBeNull();
  });

  it('should pass update with INVENTORY item ingredient => INVENTORY item ingredient', async () => {
    const toUpdate = (
      await ingredientService.findAll({
        relations: ['ingredientInventoryItem'],
      })
    ).items;
    if (!toUpdate) {
      throw new Error();
    }

    const ingredsWItems = toUpdate.filter(
      (ingred) => ingred.ingredientInventoryItem,
    );

    const newInventoryItem = await inventoryService.findOneByName(FOOD_A);
    if (!newInventoryItem) {
      throw new Error();
    }

    const measurement = await measureService.findOneByName(POUND);
    if (!measurement) {
      throw new Error();
    }

    const dto = {
      id: ingredsWItems[0].id,
      ingredientInventoryItemId: newInventoryItem.id,
      quantity: 1,
      quantityUnitTypeId: measurement.id,
    } as UpdateRecipeIngredientDto;

    const result = await validator.validateUpdateNode(
      'root',
      dto,
      ingredsWItems[0].id,
    );
    expect(result).toBeNull();
  });
});
