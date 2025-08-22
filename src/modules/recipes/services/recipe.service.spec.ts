import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { error } from 'console';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { InventoryItemService } from '../../inventory-items/services/inventory-item.service';
import { FOOD_A, FOOD_C, OTHER_C } from '../../inventory-items/utils/constants';
import { MenuItemService } from '../../menu-items/services/menu-item.service';
import { item_a } from '../../menu-items/utils/constants';
import { MenuItemTestingUtil } from '../../menu-items/utils/menu-item-testing.util';
import { UnitOfMeasureService } from '../../unit-of-measure/services/unit-of-measure.service';
import {
  GRAM,
  KILOGRAM,
  OUNCE,
  POUND,
} from '../../unit-of-measure/utils/constants';
import { NestedRecipeIngredientDto } from '../dto/recipe-ingredient/nested-recipe-ingredient.dto';
import { CreateRecipeDto } from '../dto/recipe/create-recipe.dto';
import { UpdateRecipeDto } from '../dto/recipe/update-recipe-dto';
import {
  REC_A,
  REC_B,
  REC_CAT_A,
  REC_CAT_B,
  REC_CAT_C,
  REC_F,
  REC_SUBCAT_2,
} from '../utils/constants';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeCategoryService } from './recipe-category.service';
import { RecipeIngredientService } from './recipe-ingredient.service';
import { RecipeSubCategoryService } from './recipe-sub-category.service';
import { RecipeService } from './recipe.service';

describe('recipe service', () => {
  let recipeService: RecipeService;
  let testingUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;

  let categoryService: RecipeCategoryService;
  let subCategoryService: RecipeSubCategoryService;
  let ingredientService: RecipeIngredientService;

  let unitOfMeasureService: UnitOfMeasureService;

  let invItemService: InventoryItemService;

  let menuItemService: MenuItemService;
  let menuItemTestUtil: MenuItemTestingUtil;

  let testId: number;
  let testIds: number[];

  let ingredientIds: number[];
  let testIngredientId: number;

  let testIngredDeleteId: number;
  let removalIngredIds: number[];

  let oldSubCategoryId: number;
  let newSubCategoryId: number;

  let oldCategoryId: number;
  let newCategoryId: number;

  let removalSubCatId: number;
  let removalCatId: number;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();
    testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
    dbTestContext = new DatabaseTestContext();
    //await testingUtil.initRecipeTestingDatabase(dbTestContext);
    await testingUtil.initRecipeIngredientTestingDatabase(dbTestContext);

    menuItemService = module.get<MenuItemService>(MenuItemService);
    menuItemTestUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await menuItemTestUtil.initMenuItemTestDatabase(dbTestContext);

    recipeService = module.get<RecipeService>(RecipeService);
    categoryService = module.get<RecipeCategoryService>(RecipeCategoryService);
    subCategoryService = module.get<RecipeSubCategoryService>(
      RecipeSubCategoryService,
    );
    ingredientService = module.get<RecipeIngredientService>(
      RecipeIngredientService,
    );

    unitOfMeasureService =
      module.get<UnitOfMeasureService>(UnitOfMeasureService);

    invItemService = module.get<InventoryItemService>(InventoryItemService);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(recipeService).toBeDefined();
  });

  it('should create a recipe (with no category and sub category)', async () => {
    const batchUnit = await unitOfMeasureService.findOneByName(POUND);
    if (!batchUnit) {
      throw new Error('unit of measure POUND not found');
    }
    const servingUnit = await unitOfMeasureService.findOneByName(OUNCE);
    if (!servingUnit) {
      throw new Error('unit of measure OUNCE not found');
    }

    const recName = 'testRecipe';
    const batchAmount = 1;
    const servingAmonut = 2;
    const salesAmount = 10.99;

    const ingredientItemsRequest = await invItemService.findAll();
    const ingredientItems = ingredientItemsRequest.items;

    const ingredientMeasureUnitsRequest = await unitOfMeasureService.findAll();
    const ingredientMeasureUnits = ingredientMeasureUnitsRequest.items;

    const ingredientDtos = testingUtil.createNestedRecipeIngredientDtos(
      ingredientItems.map((i) => i.id).slice(0, 3),
      [],
      ingredientMeasureUnits.map((u) => u.id).slice(0, 3),
      [1, 2, 3],
    );

    const dto = {
      recipeName: recName,
      batchResultQuantity: batchAmount,
      batchResultMeasurementId: batchUnit.id,
      servingSizeQuantity: servingAmonut,
      servingSizeMeasurementId: servingUnit.id,
      salesPrice: salesAmount,
      ingredientDtos: ingredientDtos,
    } as CreateRecipeDto;

    const result = await recipeService.create(dto);

    expect(result).not.toBeNull();
    expect(result?.recipeName).toEqual(recName);
    expect(result?.batchResultQuantity).toEqual(batchAmount);
    expect(result?.batchResultMeasurement?.id).toEqual(batchUnit.id);
    expect(result?.servingSizeQuantity).toEqual(servingAmonut);
    expect(result?.servingSizeMeasurement?.id).toEqual(servingUnit.id);
    expect(result?.salesPrice).toEqual(String(salesAmount));
    expect(result?.ingredients?.length).toEqual(3);

    testId = result?.id as number;
    if (result?.ingredients) {
      ingredientIds = result?.ingredients?.map((i) => i.id);
    }
  });

  it('recipe Ingredients should be created (queryable)', async () => {
    const results = await ingredientService.findByRecipeId(testId);
    expect(results.length).toEqual(3);
    for (const ingred of results) {
      expect(ingredientIds.findIndex((id) => id === ingred.id)).not.toEqual(-1);
    }
  });

  it('should update name', async () => {
    const updateName = 'UPDATED testRecipe';
    const dto = {
      recipeName: updateName,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.recipeName).toEqual(updateName);
  });

  it('should update isIngredient', async () => {
    const dto = {
      isIngredient: true,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.isIngredient).toBeTruthy();
  });

  it('should update ingredients (add new ingredients)', async () => {
    const testRecipe = await recipeService.findOne(testId, ['ingredients']);
    if (!testRecipe) {
      throw new Error('recipe is null');
    }
    if (!testRecipe.ingredients) {
      throw new Error('recipe ingredients is null');
    }

    const testIngredients = await ingredientService.findEntitiesById(
      testRecipe.ingredients.map((i) => i.id),
      ['ingredientInventoryItem', 'ingredientRecipe', 'quantityMeasure'],
    );
    if (!testIngredients) {
      throw new error('recipe ingredients is null');
    }

    const ingredientItemsRequest = await invItemService.findAll();
    const ingredientItems = ingredientItemsRequest.items;

    const ingredientMeasureUnitsRequest = await unitOfMeasureService.findAll();
    const ingredientMeasureUnits = ingredientMeasureUnitsRequest.items;

    const createIngredDtos = testingUtil.createNestedRecipeIngredientDtos(
      ingredientItems.map((i) => i.id).slice(3, 7),
      [],
      ingredientMeasureUnits.map((u) => u.id).slice(0, 3),
      [4, 5, 6, 7],
    );

    const nestedCreateIngredDtos = createIngredDtos.map((cDto) => {
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'create',
        createDto: cDto,
      });
    });

    const updateIngredDtos = testIngredients.map((ingred) =>
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'update',
        id: ingred.id,
        updateDto: {
          quantity: ingred.quantity,
          quantityMeasurementId: ingred.quantityMeasure.id,
          ingredientRecipeId: ingred.ingredientRecipe?.id,
          ingredientInventoryItemId: ingred.ingredientInventoryItem?.id,
        },
      }),
    );

    const dto = {
      ingredientDtos: [...updateIngredDtos, ...nestedCreateIngredDtos],
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.ingredients?.length).toEqual(7);
  });

  it('should update ingredient (modify inventory item)', async () => {
    let testInvItemId: number;

    const testRecipe = await recipeService.findOne(testId, ['ingredients']);
    if (!testRecipe) {
      throw new Error('recipe is null');
    }
    if (!testRecipe.ingredients) {
      throw new Error('recipe ingredients is null');
    }

    const ingreds = await ingredientService.findByRecipeId(testId, [
      'ingredientInventoryItem',
      'ingredientRecipe',
      'quantityMeasure',
    ]);
    if (!ingreds) {
      throw new Error('ingredient is null');
    }
    if (!ingreds[0].ingredientInventoryItem) {
      throw new Error('ingredient inventory item is null');
    }
    testIngredientId = ingreds[0].id;

    if (ingreds[0].ingredientInventoryItem.itemName === FOOD_C) {
      const item = await invItemService.findOneByName(FOOD_A);
      if (!item) {
        throw new Error('inv item not found');
      }
      ingreds[0].ingredientInventoryItem = item;
      testInvItemId = item.id;
    } else {
      const item = await invItemService.findOneByName(OTHER_C);
      if (!item) {
        throw new Error('inv item not found');
      }
      ingreds[0].ingredientInventoryItem = item;
      testInvItemId = item.id;
    }

    const ingredUpdateDtos = ingreds.map((ingred) =>
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'update',
        id: ingred.id,
        updateDto: {
          quantity: ingred.quantity,
          quantityMeasurementId: ingred.quantityMeasure.id,
          ingredientRecipeId: ingred.ingredientRecipe?.id,
          ingredientInventoryItemId: ingred.ingredientInventoryItem?.id,
        },
      }),
    );

    const dto = {
      ingredientDtos: ingredUpdateDtos,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();

    const verify = await ingredientService.findOne(testIngredientId, [
      'ingredientInventoryItem',
    ]);
    if (!verify) {
      throw new Error('ingredient to verify is null');
    }
    if (!verify.ingredientInventoryItem) {
      throw new Error('ingredient inv item is null');
    }

    expect(verify.ingredientInventoryItem.id).toEqual(testInvItemId);
  });

  it('should update ingredient (modify unitOfMeasure)', async () => {
    let testUnitId: number;

    const testRecipe = await recipeService.findOne(testId, ['ingredients']);
    if (!testRecipe) {
      throw new Error('recipe is null');
    }
    if (!testRecipe.ingredients) {
      throw new Error('recipe ingredients is null');
    }

    const ingreds = await ingredientService.findByRecipeId(testId, [
      'ingredientInventoryItem',
      'ingredientRecipe',
      'quantityMeasure',
    ]);
    if (!ingreds) {
      throw new Error('ingredient is null');
    }
    if (!ingreds[0].ingredientInventoryItem) {
      throw new Error('ingredient inventory item is null');
    }
    testIngredientId = ingreds[0].id;

    if (ingreds[0].quantityMeasure.name === POUND) {
      const unit = await unitOfMeasureService.findOneByName(OUNCE);
      if (!unit) {
        throw new Error('inv item not found');
      }
      ingreds[0].quantityMeasure = unit;
      testUnitId = unit.id;
    } else {
      const unit = await unitOfMeasureService.findOneByName(POUND);
      if (!unit) {
        throw new Error('inv item not found');
      }
      ingreds[0].quantityMeasure = unit;
      testUnitId = unit.id;
    }

    const ingredUpdateDtos = ingreds.map((ingred) =>
      plainToInstance(NestedRecipeIngredientDto, {
        id: ingred.id,
        mode: 'update',
        updateDto: {
          quantity: ingred.quantity,
          quantityMeasurementId: ingred.quantityMeasure.id,
          ingredientRecipeId: ingred.ingredientRecipe?.id,
          ingredientInventoryItemId: ingred.ingredientInventoryItem?.id,
        },
      }),
    );
    const dto = {
      ingredientDtos: ingredUpdateDtos,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();

    const verify = await ingredientService.findOne(testIngredientId, [
      'quantityMeasure',
    ]);
    if (!verify) {
      throw new Error('ingredient to verify is null');
    }
    if (!verify.quantityMeasure) {
      throw new Error('ingredient inv item is null');
    }

    expect(verify.quantityMeasure.id).toEqual(testUnitId);
  });

  it('should update ingredient (modify subRecipeIngredient)', async () => {
    let testSubRecipeId: number;

    const testRecipe = await recipeService.findOne(testId, ['ingredients']);
    if (!testRecipe) {
      throw new Error('recipe is null');
    }
    if (!testRecipe.ingredients) {
      throw new Error('recipe ingredients is null');
    }

    const ingreds = await ingredientService.findByRecipeId(testId, [
      'ingredientInventoryItem',
      'ingredientRecipe',
      'quantityMeasure',
    ]);
    if (!ingreds) {
      throw new Error('ingredient is null');
    }
    testIngredientId = ingreds[0].id;

    if (!ingreds[0].ingredientRecipe) {
      const subRec = await recipeService.findOneByName(REC_B);
      if (!subRec) {
        throw new Error('recipe not found');
      }
      ingreds[0].ingredientRecipe = subRec;
      testSubRecipeId = subRec.id;
    } else if (ingreds[0].ingredientRecipe?.recipeName === REC_A) {
      const subRec = await recipeService.findOneByName(REC_B);
      if (!subRec) {
        throw new Error('recipe not found');
      }
      ingreds[0].ingredientRecipe = subRec;
      testSubRecipeId = subRec.id;
    } else {
      const subRec = await recipeService.findOneByName(REC_F);
      if (!subRec) {
        throw new Error('recipe not found');
      }
      ingreds[0].ingredientRecipe = subRec;
      testSubRecipeId = subRec.id;
    }

    const updatedDto = plainToInstance(NestedRecipeIngredientDto, {
      mode: 'update',
      id: ingreds[0].id,
      updateDto: {
        ingredientRecipeId: ingreds[0].ingredientRecipe?.id,
        ingredientInventoryItemId: null,
      },
    });

    const theRest = ingreds.slice(1).map((ingred) =>
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'update',
        id: ingred.id,
        updateDto: {},
      }),
    );

    const dto = {
      ingredientDtos: [updatedDto, ...theRest],
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();

    const verify = await ingredientService.findOne(testIngredientId, [
      'ingredientRecipe',
    ]);
    if (!verify) {
      throw new Error('ingredient to verify is null');
    }
    if (!verify.ingredientRecipe) {
      throw new Error('ingredient sub recipe is null');
    }

    expect(verify.ingredientRecipe.id).toEqual(testSubRecipeId);
  });

  it('should update ingredient (modify quantity)', async () => {
    let testQuantity: number;

    const testRecipe = await recipeService.findOne(testId, ['ingredients']);
    if (!testRecipe) {
      throw new Error('recipe is null');
    }
    if (!testRecipe.ingredients) {
      throw new Error('recipe ingredients is null');
    }

    const ingreds = await ingredientService.findByRecipeId(testId, [
      'ingredientInventoryItem',
      'ingredientRecipe',
      'quantityMeasure',
    ]);
    if (!ingreds) {
      throw new Error('ingredient is null');
    }
    testIngredientId = ingreds[0].id;

    if (ingreds[0].quantity === 1) {
      testQuantity = 2;
      ingreds[0].quantity = testQuantity;
    } else {
      testQuantity = 1;
      ingreds[0].quantity = testQuantity;
    }

    const updateDto = plainToInstance(NestedRecipeIngredientDto, {
      mode: 'update',
      id: ingreds[0].id,
      updateDto: {
        quantity: ingreds[0].quantity,
      },
    });

    const theRest = ingreds.slice(1).map((ingred) =>
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'update',
        id: ingred.id,
        updateDto: {},
      }),
    );

    const dto = {
      ingredientDtos: [updateDto, ...theRest],
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();

    const verify = await ingredientService.findOne(testIngredientId);
    if (!verify) {
      throw new Error('ingredient to verify is null');
    }

    expect(Number(verify.quantity)).toEqual(testQuantity);
  });

  it('should update ingredients (remove ingredients)', async () => {
    const testRecipe = await recipeService.findOne(testId, ['ingredients']);
    if (!testRecipe) {
      throw new Error('recipe is null');
    }
    if (!testRecipe.ingredients) {
      throw new Error('recipe ingredients is null');
    }

    const ingredUpdateDtos = testRecipe.ingredients.slice(1).map((ingred) =>
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'update',
        id: ingred.id,
        updateDto: {},
      }),
    );

    const dto = {
      ingredientDtos: ingredUpdateDtos,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    if (!result?.ingredients) {
      throw new Error('recipe ingredients is null');
    }

    expect(result).not.toBeNull();
    expect(result?.ingredients?.length).toEqual(6);

    testIngredDeleteId = result?.ingredients[0].id as number;
  });

  it('should remove all but 6 recipe ingredient from table', async () => {
    const ingreds = await ingredientService.findByRecipeId(testId);
    expect(ingreds).not.toBeNull();
    expect(ingreds.length).toEqual(6);
  });

  it('should update batch UnitOfMeaure', async () => {
    const batchUnit = await unitOfMeasureService.findOneByName(KILOGRAM);
    if (!batchUnit) {
      throw new Error('unit of measure kilogram not found');
    }

    const dto = {
      batchResultMeasurementId: batchUnit.id,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.batchResultMeasurement?.name).toEqual(KILOGRAM);
  });

  it('should update servingSize UnitOfMeasure', async () => {
    const servingUnit = await unitOfMeasureService.findOneByName(GRAM);
    if (!servingUnit) {
      throw new Error('unit of measure gram not found');
    }
    const dto = {
      servingSizeMeasurementId: servingUnit.id,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.servingSizeMeasurement?.name).toEqual(GRAM);
  });

  it('should update batch result quantity', async () => {
    const updateBatchAmount = 2;
    const dto = {
      batchResultQuantity: updateBatchAmount,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.batchResultQuantity).toEqual(updateBatchAmount);
  });

  it('should update serving size quantity', async () => {
    const updateServingAmount = 4;
    const dto = {
      servingSizeQuantity: updateServingAmount,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.servingSizeQuantity).toEqual(updateServingAmount);
  });

  it('should update sales price', async () => {
    const updateSalesAmount = 14.99;
    const dto = {
      salesPrice: updateSalesAmount,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.salesPrice).toEqual(String(updateSalesAmount));
  });

  it('should set category', async () => {
    const testRecipe = await recipeService.findOne(testId, ['category']);
    if (!testRecipe) {
      throw new Error('recipe is null');
    }

    const cat = await categoryService.findOneByName(REC_CAT_B);
    if (!cat) {
      throw new Error('recipe category is null');
    }

    const dto = {
      categoryId: cat.id,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();

    oldCategoryId = result?.category?.id as number;
  });

  it('should gain reference for new category', async () => {
    const cat = await categoryService.findOne(oldCategoryId, ['recipes']);
    if (!cat) {
      throw new Error('category is null');
    }
    expect(cat.recipes.findIndex((rec) => rec.id === testId)).not.toEqual(-1);
  });

  it('should set sub category', async () => {
    const testRecipe = await recipeService.findOne(testId, ['category']);
    if (!testRecipe) {
      throw new Error('recipe is null');
    }

    if (!testRecipe.category) {
      throw new Error('recipe category is null');
    }

    const category = await categoryService.findOne(testRecipe.category.id, [
      'subCategories',
    ]);

    if (!category) {
      throw new Error('category is null');
    }

    if (!category.subCategories) {
      throw new Error('category subCategories is null');
    }

    const dto = {
      subCategoryId: category.subCategories[0].id,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    if (!result?.subCategory) {
      throw new Error('recipe subCategory is null');
    }

    expect(result).not.toBeNull();
    expect(result?.subCategory.id).toEqual(category.subCategories[0].id);

    oldSubCategoryId = result?.subCategory.id as number;
  });

  it('should gain reference from sub category', async () => {
    const subCat = await subCategoryService.findOne(oldSubCategoryId, [
      'recipes',
    ]);

    if (!subCat) {
      throw new Error('sub category is null');
    }

    expect(subCat.recipes.findIndex((rec) => rec.id === testId)).not.toEqual(
      -1,
    );
  });

  it('should change sub category', async () => {
    const testRecipe = await recipeService.findOne(testId, ['category']);
    if (!testRecipe) {
      throw new Error('recipe is null');
    }
    if (!testRecipe.category) {
      throw new Error('recipe category is null');
    }

    const category = await categoryService.findOne(testRecipe.category.id, [
      'subCategories',
    ]);

    if (!category) {
      throw new Error('category is null');
    }

    if (!category.subCategories) {
      throw new Error('category subCategories is null');
    }

    const dto = {
      subCategoryId: category.subCategories[1].id,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    if (!result?.subCategory) {
      throw new Error('recipe subCategory is null');
    }

    expect(result).not.toBeNull();
    expect(result?.subCategory.id).toEqual(category.subCategories[1].id);

    newSubCategoryId = result?.subCategory.id as number;
  });

  it('should lose reference from old category', async () => {
    const oldCat = await subCategoryService.findOne(oldSubCategoryId, [
      'recipes',
    ]);
    if (!oldCat) {
      throw new Error('category is null');
    }
    expect(oldCat.recipes.findIndex((rec) => rec.id === testId)).toEqual(-1);
  });

  it('should gain reference from new sub category', async () => {
    const newSubCat = await subCategoryService.findOne(newSubCategoryId, [
      'recipes',
    ]);
    if (!newSubCat) {
      throw new Error('sub category is null');
    }
    expect(newSubCat.recipes.findIndex((rec) => rec.id === testId)).not.toEqual(
      -1,
    );
  });

  it('should update category', async () => {
    const testRecipe = await recipeService.findOne(testId, ['category']);
    if (!testRecipe) {
      throw new Error('recipe is null');
    }

    const cat = await categoryService.findOneByName(REC_CAT_C);
    if (!cat) {
      throw new Error('recipe category is null');
    }

    const dto = {
      categoryId: cat.id,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();

    newCategoryId = result?.category?.id as number;
  });

  it('should lose reference from old category', async () => {
    const cat = await categoryService.findOne(oldCategoryId, ['recipes']);
    if (!cat) {
      throw new Error('category is null');
    }
    expect(cat.recipes.findIndex((rec) => rec.id === testId)).toEqual(-1);
  });

  it('should gain reference for new category', async () => {
    const cat = await categoryService.findOne(newCategoryId, ['recipes']);
    if (!cat) {
      throw new Error('category is null');
    }
    expect(cat.recipes.findIndex((rec) => rec.id === testId)).not.toEqual(-1);
  });

  it('should have null sub-category', async () => {
    const testRecipe = await recipeService.findOne(testId, ['subCategory']);
    if (!testRecipe) {
      throw new Error('recipe is null');
    }
    expect(testRecipe.subCategory).toBeNull();
  });

  it('should set sub category (for next test)', async () => {
    const testRecipe = await recipeService.findOne(testId, ['category']);
    if (!testRecipe) {
      throw new Error('recipe is null');
    }
    if (!testRecipe.category) {
      throw new Error('recipe category is null');
    }

    const cat = await categoryService.findOneByName(REC_CAT_B, [
      'subCategories',
    ]);
    if (!cat) {
      throw new Error('recipe category is null');
    }
    if (!cat.subCategories) {
      throw new Error('recipe sub-category is null');
    }

    const dto = {
      categoryId: cat.id,
      subCategoryId: cat.subCategories[0].id,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    if (!result?.subCategory) {
      throw new Error('recipe subCategory is null');
    }

    expect(result).not.toBeNull();
    expect(result?.subCategory.id).toEqual(cat.subCategories[0].id);

    newSubCategoryId = result?.subCategory.id as number;
  });

  it('should update sub category (to no sub category)', async () => {
    const dto = {
      subCategoryId: null,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.subCategory).toBeNull();
  });

  it('should lose reference from previous sub category', async () => {
    const oldSubCat = await subCategoryService.findOne(newSubCategoryId, [
      'recipes',
    ]);
    if (!oldSubCat) {
      throw new Error('sub category is null');
    }
    expect(oldSubCat.recipes.findIndex((rec) => rec.id === testId)).toEqual(-1);
  });

  it('should update category (to no category)', async () => {
    const dto = {
      categoryId: null,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();

    const verify = await recipeService.findOne(testId, [
      'category',
      'subCategory',
    ]);
    if (!verify) {
      throw new NotFoundException();
    }
    expect(verify?.category).toBeNull();
    expect(verify?.subCategory).toBeNull();
  });

  it('should lose reference from previous category', async () => {
    const cat = await categoryService.findOne(newCategoryId, ['recipes']);
    if (!cat) {
      throw new Error('category is null');
    }
    expect(cat.recipes.findIndex((rec) => rec.id === testId)).toEqual(-1);
  });

  it('should update menuItem', async () => {
    const menuItem = await menuItemService.findOneByName(item_a);
    if (!menuItem) {
      throw new NotFoundException();
    }

    const dto = {
      producedMenuItemId: menuItem.id,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.producedMenuItem?.id).toEqual(menuItem.id);
  });

  it('should remove menuItem', async () => {
    const dto = {
      producedMenuItemId: null,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.producedMenuItem).toBeNull();
  });

  it('should find a recipe by name', async () => {
    const result = await recipeService.findOneByName(REC_A);
    expect(result).not.toBeNull();
    expect(result?.recipeName).toEqual(REC_A);
  });

  it('should set category and subcategory (for next test)', async () => {
    const category = await categoryService.findOneByName(REC_CAT_B, [
      'subCategories',
    ]);
    if (!category) {
      throw new Error('category is null');
    }
    if (!category.subCategories) {
      throw new Error('category subCategories is null');
    }

    const dto = {
      categoryId: category.id,
      subCategoryId: category.subCategories[0].id,
    } as UpdateRecipeDto;

    await recipeService.update(testId, dto);
  });

  it('should remove a recipe', async () => {
    const removalRecipe = await recipeService.findOne(testId, [
      'category',
      'subCategory',
      'ingredients',
    ]);
    if (!removalRecipe) {
      throw new Error('recipe to remove is null');
    }
    if (!removalRecipe.category) {
      throw new Error('');
    }
    if (!removalRecipe.subCategory) {
      throw new Error('');
    }
    if (!removalRecipe.ingredients) {
      throw new Error('');
    }

    removalCatId = removalRecipe.category?.id;
    removalSubCatId = removalRecipe.subCategory?.id;
    removalIngredIds = removalRecipe.ingredients.map((ingred) => ingred.id);

    const removal = await recipeService.remove(removalRecipe?.id);
    expect(removal).toBeTruthy();

    await expect(recipeService.findOne(removalRecipe?.id)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should delete recipe ingredients', async () => {
    const ingreds = await ingredientService.findEntitiesById(removalIngredIds);
    expect(ingreds.length).toEqual(0);
  });

  it('should lose reference from sub category', async () => {
    const subCat = await subCategoryService.findOne(removalSubCatId, [
      'recipes',
    ]);
    if (!subCat) {
      throw new Error('sub category is null');
    }
    if (!subCat.recipes) {
      throw new Error('recipes is null');
    }
    expect(subCat.recipes.findIndex((r) => r.id === removalSubCatId)).toEqual(
      -1,
    );
  });

  it('should lose reference from category', async () => {
    const cat = await categoryService.findOne(removalCatId, ['recipes']);
    if (!cat) {
      throw new Error('category is null');
    }
    if (!cat.recipes) {
      throw new Error('recipes is null');
    }
    expect(cat.recipes.findIndex((r) => r.id === removalCatId)).toEqual(-1);
  });

  it('should get all recipes', async () => {
    const expected = await testingUtil.getTestRecipeEntities(dbTestContext);

    const results = await recipeService.findAll({
      relations: ['ingredients'],
    });

    expect(results.items.length).toEqual(expected.length);
    testIds = [results.items[0].id, results.items[1].id, results.items[2].id];
  });

  it('should sort all recipes by name', async () => {
    const results = await recipeService.findAll({ sortBy: 'recipeName' });
    expect(results.items.length).toEqual(6);
  });

  it('should sort all recipes by category', async () => {
    const results = await recipeService.findAll({ sortBy: 'recipeCategory' });
    expect(results.items.length).toEqual(6);
  });

  it('should sort all recipes by sub category', async () => {
    const results = await recipeService.findAll({
      sortBy: 'recipeSubCategory',
    });
    expect(results.items.length).toEqual(6);
  });

  it('should search all recipes', async () => {
    const results = await recipeService.findAll({ search: REC_A });

    expect(results.items.length).toEqual(1);
  });

  it('should search all recipes by ingredients', async () => {
    const results = await recipeService.findAll({ search: FOOD_A });

    expect(results.items.length).toEqual(2);
  });

  it('should filter recipe category all recipes', async () => {
    const recCat = await categoryService.findOneByName(REC_CAT_A);
    if (!recCat) {
      throw new Error();
    }

    const results = await recipeService.findAll({
      filters: [`category=${recCat.id}`],
    });

    expect(results.items.length).toEqual(3);
  });

  it('should filter recipe sub category all recipes', async () => {
    const recCat = await subCategoryService.findOneByName(REC_SUBCAT_2);
    if (!recCat) {
      throw new Error();
    }

    const results = await recipeService.findAll({
      filters: [`subCategory=${recCat.id}`],
    });

    expect(results.items.length).toEqual(1);
  });

  it('should get recipes by list of ids', async () => {
    const results = await recipeService.findEntitiesById(testIds);
    expect(results).not.toBeNull();
    expect(results.length).toEqual(testIds.length);
    for (const result of results) {
      expect(testIds.findIndex((id) => id === result.id)).not.toEqual(-1);
    }
  });
});
