import { TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import {
  DUPLICATE,
  EXIST,
  INVALID,
} from '../../../util/exceptions/error_constants';
import { ValidationException } from '../../../util/exceptions/validation-exception';
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
import { REC_A, REC_B, REC_C, REC_CAT_A, REC_F } from '../utils/constants';
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
      recipeName: 'CREATE',
      categoryId: category.id,
      subCategoryId: category.subCategories[0].id,
      batchResultMeasurementId: batchMeasurement.id,
      batchResultQuantity: 1,
      servingSizeMeasurementId: servingMeasurement.id,
      servingSizeQuantity: 1,
      ingredientDtos: ingredDtos,
    } as CreateRecipeDto;

    await validator.validateCreate(dto);
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
      recipeName: REC_C,
      batchResultMeasurementId: batchMeasurement.id,
      batchResultQuantity: 1,
      servingSizeMeasurementId: servingMeasurement.id,
      servingSizeQuantity: 1,
      ingredientDtos: ingredDtos,
    } as CreateRecipeDto;

    try {
      await validator.validateCreate(dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(EXIST);
    }
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
      recipeName: 'CREATE',
      subCategoryId: category.subCategories[0].id,
      batchResultMeasurementId: batchMeasurement.id,
      batchResultQuantity: 1,
      servingSizeMeasurementId: servingMeasurement.id,
      servingSizeQuantity: 1,
      ingredientDtos: ingredDtos,
    } as CreateRecipeDto;

    try {
      await validator.validateCreate(dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(INVALID);
    }
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
      recipeName: 'CREATE',
      categoryId: category.id,
      subCategoryId: badSubCats[0].id,
      batchResultMeasurementId: batchMeasurement.id,
      batchResultQuantity: 1,
      servingSizeMeasurementId: servingMeasurement.id,
      servingSizeQuantity: 1,
      ingredientDtos: ingredDtos,
    } as CreateRecipeDto;

    try {
      await validator.validateCreate(dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(INVALID);
    }
  });

  it('should fail create: duplicate recipe ingredients', async () => {
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
      recipeName: 'CREATE',
      categoryId: category.id,
      subCategoryId: category.subCategories[0].id,
      batchResultMeasurementId: batchMeasurement.id,
      batchResultQuantity: 1,
      servingSizeMeasurementId: servingMeasurement.id,
      servingSizeQuantity: 1,
      ingredientDtos: ingredDtos,
    } as CreateRecipeDto;

    try {
      await validator.validateCreate(dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(DUPLICATE);
    }
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
      recipeName: 'UPDATE',
      categoryId: category.id,
      subCategoryId: category.subCategories[0].id,
      batchResultMeasurementId: batchMeasurement.id,
      batchResultQuantity: 1,
      servingSizeMeasurementId: servingMeasurement.id,
      servingSizeQuantity: 1,
      ingredientDtos: ingredDtos,
    } as UpdateRecipeDto;

    await validator.validateUpdate(toUpdate.id, dto);
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
      recipeName: REC_C,
      categoryId: category.id,
      subCategoryId: category.subCategories[0].id,
      batchResultMeasurementId: batchMeasurement.id,
      batchResultQuantity: 1,
      servingSizeMeasurementId: servingMeasurement.id,
      servingSizeQuantity: 1,
      ingredientDtos: ingredDtos,
    } as UpdateRecipeDto;

    try {
      await validator.validateUpdate(toUpdate.id, dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(EXIST);
    }
  });

  it('should fail update: subcategory with no category', async () => {
    const toUpdate = await recipeService.findOneByName(REC_F, ['ingredients']);
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
      recipeName: 'UPDATE',
      subCategoryId: category.subCategories[0].id,
      batchResultMeasurementId: batchMeasurement.id,
      batchResultQuantity: 1,
      servingSizeMeasurementId: servingMeasurement.id,
      servingSizeQuantity: 1,
      ingredientDtos: ingredDtos,
    } as UpdateRecipeDto;

    try {
      await validator.validateUpdate(toUpdate.id, dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(INVALID);
    }
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
      recipeName: 'UPDATE',
      categoryId: category.id,
      subCategoryId: badSubCats[0].id,
      batchResultMeasurementId: batchMeasurement.id,
      batchResultQuantity: 1,
      servingSizeMeasurementId: servingMeasurement.id,
      servingSizeQuantity: 1,
      ingredientDtos: ingredDtos,
    } as UpdateRecipeDto;

    try {
      await validator.validateUpdate(toUpdate.id, dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(INVALID);
    }
  });

  it('should fail update: duplicate ingredients (update)', async () => {
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

    const recIngredB = await recipeService.findOneByName(REC_B);
    if (!recIngredB) {
      throw new Error();
    }

    const recIngredC = await recipeService.findOneByName(REC_C);
    if (!recIngredC) {
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
          ingredientRecipeId: recIngredB.id,
          quantity: 1,
          quantityMeasurementId: servingMeasurement.id,
        },
      }),
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'update',
        id: toUpdate.ingredients[0].id,
        updateDto: {
          ingredientRecipeId: recIngredC.id,
          quantity: 1,
          quantityMeasurementId: servingMeasurement.id,
        },
      }),
    ];

    const dto = {
      recipeName: 'UPDATE',
      categoryId: category.id,
      subCategoryId: category.subCategories[0].id,
      batchResultMeasurementId: batchMeasurement.id,
      batchResultQuantity: 1,
      servingSizeMeasurementId: servingMeasurement.id,
      servingSizeQuantity: 1,
      ingredientDtos: ingredDtos,
    } as UpdateRecipeDto;

    try {
      await validator.validateUpdate(toUpdate.id, dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(DUPLICATE);
    }
  });

  it('should fail update: duplicate ingredients (create)', async () => {
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
      plainToInstance(NestedRecipeIngredientDto, {
        mode: 'create',
        createDto: {
          ingredientInventoryItemId: invIngred.id,
          quantity: 1,
          quantityMeasurementId: servingMeasurement.id,
        },
      }),
    ];

    const dto = {
      recipeName: 'UPDATE',
      categoryId: category.id,
      subCategoryId: category.subCategories[0].id,
      batchResultMeasurementId: batchMeasurement.id,
      batchResultQuantity: 1,
      servingSizeMeasurementId: servingMeasurement.id,
      servingSizeQuantity: 1,
      ingredientDtos: ingredDtos,
    } as UpdateRecipeDto;

    try {
      await validator.validateUpdate(toUpdate.id, dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(DUPLICATE);
    }
  });
});
