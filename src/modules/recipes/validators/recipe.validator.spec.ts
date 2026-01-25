import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { FOOD_B } from '../../inventory-items/utils/constants';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { POUND } from '../../unit-of-measure/utils/constants';
import { CreateRecipeDto } from '../dto/recipe/create-recipe.dto';
import { UpdateRecipeDto } from '../dto/recipe/update-recipe-dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { Recipe } from '../entities/recipe.entity';
import { REC_A, REC_B, REC_C, REC_CAT_A } from '../utils/constants';
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
