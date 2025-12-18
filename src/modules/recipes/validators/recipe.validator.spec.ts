import { TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { InventoryItemService } from '../../inventory-items/services/inventory-item.service';
import { FOOD_B } from '../../inventory-items/utils/constants';
import { UnitOfMeasureService } from '../../unit-of-measure/services/unit-of-measure.service';
import { POUND } from '../../unit-of-measure/utils/constants';
import { NestedRecipeIngredientDto } from '../dto/recipe-ingredient/nested-recipe-ingredient.dto';
import { CreateRecipeDto } from '../dto/recipe/create-recipe.dto';
import { UpdateRecipeDto } from '../dto/recipe/update-recipe-dto';
import { RecipeCategoryService } from '../services/recipe-category.service';
import { RecipeSubCategoryService } from '../services/recipe-sub-category.service';
import { RecipeService } from '../services/recipe.service';
import { REC_A, REC_B, REC_C, REC_CAT_A } from '../utils/constants';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeValidator } from './recipe.valdiator';

describe('recipe validator', () => {
  let testingUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: RecipeValidator;

  let recipeService: RecipeService;
  let categoryService: RecipeCategoryService;
  let subCategoryService: RecipeSubCategoryService;
  let measureService: UnitOfMeasureService;
  let inventoryService: InventoryItemService;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();
    validator = module.get<RecipeValidator>(RecipeValidator);

    recipeService = module.get<RecipeService>(RecipeService);
    categoryService = module.get<RecipeCategoryService>(RecipeCategoryService);
    subCategoryService = module.get<RecipeSubCategoryService>(
      RecipeSubCategoryService,
    );
    measureService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
    inventoryService = module.get<InventoryItemService>(InventoryItemService);

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
    await testingUtil.initRecipeIngredientTestingDatabase(dbTestContext);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  it('should validate create', async () => {
    const category = await categoryService.findOneByName(REC_CAT_A, [
      'subCategories',
    ]);
    if (!category) {
      throw new Error();
    }

    const batchMeasurement = await measureService.findOneByName(POUND);
    if (!batchMeasurement) {
      throw new Error();
    }

    const servingMeasurement = await measureService.findOneByName(POUND);
    if (!servingMeasurement) {
      throw new Error();
    }

    const invIngred = await inventoryService.findOneByName(FOOD_B);
    if (!invIngred) {
      throw new Error();
    }

    const recIngred = await recipeService.findOneByName(REC_B);
    if (!recIngred) {
      throw new Error();
    }

    const ingredDtos = [
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'create',
        createDto: {
          ingredientInventoryItemId: invIngred.id,
          quantity: 1,
          quantityMeasurementId: servingMeasurement.id,
        },
      }),
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'create',
        createDto: {
          ingredientRecipeId: recIngred.id,
          quantity: 1,
          quantityMeasurementId: servingMeasurement.id,
        },
      }),
    ];

    const dto = {
      name: 'CREATE',
      categoryId: category.id,
      subCategoryId: category.subCategories[0].id,
      batchResultUnitTypeId: batchMeasurement.id,
      batchResultQuantity: 1,
      servingSizeUnitTypeId: servingMeasurement.id,
      servingSizeQuantity: 1,
      ingredients: ingredDtos,
    } as CreateRecipeDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should fail create: name already exists', async () => {
    const batchMeasurement = await measureService.findOneByName(POUND);
    if (!batchMeasurement) {
      throw new Error();
    }

    const servingMeasurement = await measureService.findOneByName(POUND);
    if (!servingMeasurement) {
      throw new Error();
    }

    const invIngred = await inventoryService.findOneByName(FOOD_B);
    if (!invIngred) {
      throw new Error();
    }

    const recIngred = await recipeService.findOneByName(REC_B);
    if (!recIngred) {
      throw new Error();
    }

    const ingredDtos = [
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'create',
        createDto: {
          ingredientInventoryItemId: invIngred.id,
          quantity: 1,
          quantityMeasurementId: servingMeasurement.id,
        },
      }),
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'create',
        createDto: {
          ingredientRecipeId: recIngred.id,
          quantity: 1,
          quantityMeasurementId: servingMeasurement.id,
        },
      }),
    ];

    const dto = {
      name: REC_C,
      batchResultUnitTypeId: batchMeasurement.id,
      batchResultQuantity: 1,
      servingSizeUnitTypeId: servingMeasurement.id,
      servingSizeQuantity: 1,
      ingredients: ingredDtos,
    } as CreateRecipeDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('recipeName');
  });

  it('should fail create: subcatgory with no category', async () => {
    const category = await categoryService.findOneByName(REC_CAT_A, [
      'subCategories',
    ]);
    if (!category) {
      throw new Error();
    }

    const batchMeasurement = await measureService.findOneByName(POUND);
    if (!batchMeasurement) {
      throw new Error();
    }

    const servingMeasurement = await measureService.findOneByName(POUND);
    if (!servingMeasurement) {
      throw new Error();
    }

    const invIngred = await inventoryService.findOneByName(FOOD_B);
    if (!invIngred) {
      throw new Error();
    }

    const recIngred = await recipeService.findOneByName(REC_B);
    if (!recIngred) {
      throw new Error();
    }

    const ingredDtos = [
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'create',
        createDto: {
          ingredientInventoryItemId: invIngred.id,
          quantity: 1,
          quantityMeasurementId: servingMeasurement.id,
        },
      }),
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'create',
        createDto: {
          ingredientRecipeId: recIngred.id,
          quantity: 1,
          quantityMeasurementId: servingMeasurement.id,
        },
      }),
    ];

    const dto = {
      name: 'CREATE',
      subCategoryId: category.subCategories[0].id,
      batchResultUnitTypeId: batchMeasurement.id,
      batchResultQuantity: 1,
      servingSizeUnitTypeId: servingMeasurement.id,
      servingSizeQuantity: 1,
      ingredients: ingredDtos,
    } as CreateRecipeDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('category');
  });

  it('should fail create: recipeIngredient validator: no ingredient reference', async () => {
    const category = await categoryService.findOneByName(REC_CAT_A, [
      'subCategories',
    ]);
    if (!category) {
      throw new Error();
    }

    const batchMeasurement = await measureService.findOneByName(POUND);
    if (!batchMeasurement) {
      throw new Error();
    }

    const servingMeasurement = await measureService.findOneByName(POUND);
    if (!servingMeasurement) {
      throw new Error();
    }

    const invIngred = await inventoryService.findOneByName(FOOD_B);
    if (!invIngred) {
      throw new Error();
    }

    const recIngred = await recipeService.findOneByName(REC_B);
    if (!recIngred) {
      throw new Error();
    }

    const ingredDtos = [
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'create',
        createDto: {
          quantity: 1,
          quantityMeasurementId: servingMeasurement.id,
        },
      }),
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'create',
        createDto: {
          quantity: 1,
          quantityMeasurementId: servingMeasurement.id,
        },
      }),
    ];

    const dto = {
      name: 'CREATE',
      categoryId: category.id,
      subCategoryId: category.subCategories[0].id,
      batchResultUnitTypeId: batchMeasurement.id,
      batchResultQuantity: 1,
      servingSizeUnitTypeId: servingMeasurement.id,
      servingSizeQuantity: 1,
      ingredients: ingredDtos,
    } as CreateRecipeDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('ingredients');
  });

  it('should fail update: subcategory with wrong parent category', async () => {
    const category = await categoryService.findOneByName(REC_CAT_A, [
      'subCategories',
    ]);
    if (!category) {
      throw new Error();
    }

    const subCats = (await subCategoryService.findAll()).items;

    const badSubCats = subCats.filter(
      (subCat) =>
        !category.subCategories.some((validCat) => validCat.id === subCat.id),
    );

    const batchMeasurement = await measureService.findOneByName(POUND);
    if (!batchMeasurement) {
      throw new Error();
    }

    const servingMeasurement = await measureService.findOneByName(POUND);
    if (!servingMeasurement) {
      throw new Error();
    }

    const invIngred = await inventoryService.findOneByName(FOOD_B);
    if (!invIngred) {
      throw new Error();
    }

    const recIngred = await recipeService.findOneByName(REC_B);
    if (!recIngred) {
      throw new Error();
    }

    const ingredDtos = [
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'create',
        createDto: {
          ingredientInventoryItemId: invIngred.id,
          quantity: 1,
          quantityMeasurementId: servingMeasurement.id,
        },
      }),
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'create',
        createDto: {
          ingredientRecipeId: recIngred.id,
          quantity: 1,
          quantityMeasurementId: servingMeasurement.id,
        },
      }),
    ];

    const dto = {
      name: 'CREATE',
      categoryId: category.id,
      subCategoryId: badSubCats[0].id,
      batchResultUnitTypeId: batchMeasurement.id,
      batchResultQuantity: 1,
      servingSizeUnitTypeId: servingMeasurement.id,
      servingSizeQuantity: 1,
      ingredients: ingredDtos,
    } as CreateRecipeDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('subCategory');
  });

  it('should pass update', async () => {
    const toUpdate = await recipeService.findOneByName(REC_A, ['ingredients']);
    if (!toUpdate) {
      throw new Error();
    }

    const category = await categoryService.findOneByName(REC_CAT_A, [
      'subCategories',
    ]);
    if (!category) {
      throw new Error();
    }

    const batchMeasurement = await measureService.findOneByName(POUND);
    if (!batchMeasurement) {
      throw new Error();
    }

    const servingMeasurement = await measureService.findOneByName(POUND);
    if (!servingMeasurement) {
      throw new Error();
    }

    const invIngred = await inventoryService.findOneByName(FOOD_B);
    if (!invIngred) {
      throw new Error();
    }

    const recIngred = await recipeService.findOneByName(REC_B);
    if (!recIngred) {
      throw new Error();
    }

    const ingredDtos = [
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'create',
        createDto: {
          ingredientInventoryItemId: invIngred.id,
          quantity: 1,
          quantityMeasurementId: servingMeasurement.id,
        },
      }),
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'update',
        id: toUpdate.ingredients[0].id,
        updateDto: {
          ingredientRecipeId: recIngred.id,
          quantity: 1,
          quantityMeasurementId: servingMeasurement.id,
        },
      }),
    ];

    const dto = {
      name: 'UPDATE',
      categoryId: category.id,
      subCategoryId: category.subCategories[0].id,
      batchResultUnitTypeId: batchMeasurement.id,
      batchResultQuantity: 1,
      servingSizeUnitTypeId: servingMeasurement.id,
      servingSizeQuantity: 1,
      ingredients: ingredDtos,
    } as UpdateRecipeDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeNull();
  });

  it('should fail update: name already exists', async () => {
    const toUpdate = await recipeService.findOneByName(REC_B, ['ingredients']);
    if (!toUpdate) {
      throw new Error();
    }

    const category = await categoryService.findOneByName(REC_CAT_A, [
      'subCategories',
    ]);
    if (!category) {
      throw new Error();
    }

    const batchMeasurement = await measureService.findOneByName(POUND);
    if (!batchMeasurement) {
      throw new Error();
    }

    const servingMeasurement = await measureService.findOneByName(POUND);
    if (!servingMeasurement) {
      throw new Error();
    }

    const invIngred = await inventoryService.findOneByName(FOOD_B);
    if (!invIngred) {
      throw new Error();
    }

    const recIngred = await recipeService.findOneByName(REC_B);
    if (!recIngred) {
      throw new Error();
    }

    const ingredDtos = [
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'create',
        createDto: {
          ingredientInventoryItemId: invIngred.id,
          quantity: 1,
          quantityMeasurementId: servingMeasurement.id,
        },
      }),
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'update',
        id: toUpdate.ingredients[0].id,
        updateDto: {
          ingredientRecipeId: recIngred.id,
          quantity: 1,
          quantityMeasurementId: servingMeasurement.id,
        },
      }),
    ];

    const dto = {
      name: REC_C,
      categoryId: category.id,
      subCategoryId: category.subCategories[0].id,
      batchResultUnitTypeId: batchMeasurement.id,
      batchResultQuantity: 1,
      servingSizeUnitTypeId: servingMeasurement.id,
      servingSizeQuantity: 1,
      ingredients: ingredDtos,
    } as UpdateRecipeDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('recipeName');
  });

  it('should fail update: subcategory with wrong parent category', async () => {
    const toUpdate = await recipeService.findOneByName(REC_A, ['ingredients']);
    if (!toUpdate) {
      throw new Error();
    }

    const category = await categoryService.findOneByName(REC_CAT_A, [
      'subCategories',
    ]);
    if (!category) {
      throw new Error();
    }

    const subCats = (await subCategoryService.findAll()).items;

    const badSubCats = subCats.filter(
      (subCat) =>
        !category.subCategories.some((validCat) => validCat.id === subCat.id),
    );

    const batchMeasurement = await measureService.findOneByName(POUND);
    if (!batchMeasurement) {
      throw new Error();
    }

    const servingMeasurement = await measureService.findOneByName(POUND);
    if (!servingMeasurement) {
      throw new Error();
    }

    const invIngred = await inventoryService.findOneByName(FOOD_B);
    if (!invIngred) {
      throw new Error();
    }

    const recIngred = await recipeService.findOneByName(REC_B);
    if (!recIngred) {
      throw new Error();
    }

    const ingredDtos = [
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'create',
        createDto: {
          ingredientInventoryItemId: invIngred.id,
          quantity: 1,
          quantityMeasurementId: servingMeasurement.id,
        },
      }),
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'update',
        id: toUpdate.ingredients[0].id,
        updateDto: {
          ingredientRecipeId: recIngred.id,
          quantity: 1,
          quantityMeasurementId: servingMeasurement.id,
        },
      }),
    ];

    const dto = {
      name: 'UPDATE',
      categoryId: category.id,
      subCategoryId: badSubCats[0].id,
      batchResultUnitTypeId: batchMeasurement.id,
      batchResultQuantity: 1,
      servingSizeUnitTypeId: servingMeasurement.id,
      servingSizeQuantity: 1,
      ingredients: ingredDtos,
    } as UpdateRecipeDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('subCategory');
  });

  /** No update validation implementation
  it('should fail update: recipeIngredient validator: ...', async () => {
    throw new NotImplementedException();
  })*/
});
