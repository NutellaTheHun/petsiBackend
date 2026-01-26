import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { expectValidationMessage } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { FOOD_A, FOOD_B } from '../../inventory-items/utils/constants';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { OUNCE, POUND } from '../../unit-of-measure/utils/constants';
import { CreateRecipeDto } from '../dto/recipe/create-recipe.dto';
import { UpdateRecipeDto } from '../dto/recipe/update-recipe-dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { Recipe } from '../entities/recipe.entity';
import { REC_A, REC_B, REC_CAT_A, REC_SUBCAT_1 } from '../utils/constants';
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
  it('successfully validate create: no validation errors', async () => {
    const category = await categoryRepo.findOne({
      where: { name: REC_CAT_A },
      relations: ['subCategories'],
    });
    if (!category) {
      throw new Error('category not found');
    }
    if (!category.subCategories || category.subCategories.length === 0) {
      throw new Error('subcategories not found');
    }
    const food_a = await inventoryItemRepo.findOne({
      where: { name: FOOD_A },
    });
    if (!food_a) {
      throw new Error('inventory item not found');
    }
    const food_b = await inventoryItemRepo.findOne({
      where: { name: FOOD_B },
    });
    if (!food_b) {
      throw new Error('inventory item not found');
    }
    const batchUom = await unitOfMeasureRepo.findOne({
      where: { name: POUND },
    });
    if (!batchUom) {
      throw new Error('batch uom not found');
    }
    const servingUom = await unitOfMeasureRepo.findOne({
      where: { name: OUNCE },
    });
    if (!servingUom) {
      throw new Error('serving uom not found');
    }

    const dto: CreateRecipeDto = {
      name: 'New Recipe',
      batchResultQuantity: 5,
      batchResultUnitTypeId: batchUom.id,
      servingSizeQuantity: 2,
      servingSizeUnitTypeId: servingUom.id,
      salesPrice: 10.99,
      categoryId: category.id,
      subCategoryId: category.subCategories[0].id,
      isIngredient: true,
      ingredients: [
        {
          createId: 'c1',
          ingredientInventoryItemId: food_a.id,
          quantity: 3,
          quantityUnitTypeId: batchUom.id,
        },
        {
          createId: 'c2',
          ingredientInventoryItemId: food_b.id,
          quantity: 4,
          quantityUnitTypeId: servingUom.id,
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expect(errors).toBeNull();
  });

  it('fail validate create: name already exists', async () => {
    const batchUom = await unitOfMeasureRepo.findOne({
      where: { name: POUND },
    });
    if (!batchUom) {
      throw new Error('batch uom not found');
    }
    const servingUom = await unitOfMeasureRepo.findOne({
      where: { name: OUNCE },
    });
    if (!servingUom) {
      throw new Error('serving uom not found');
    }

    const dto: CreateRecipeDto = {
      name: REC_A,
      batchResultQuantity: 5,
      batchResultUnitTypeId: batchUom.id,
      servingSizeQuantity: 2,
      servingSizeUnitTypeId: servingUom.id,
      isIngredient: false,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'name' }],
      'Recipe with this name already exists.',
    );
  });

  it('fail validate create: requires category if assigning sub-category', async () => {
    const subCategory = await subCategoryRepo.findOne({
      where: { name: REC_SUBCAT_1 },
    });
    if (!subCategory) {
      throw new Error('subcategory not found');
    }
    const batchUom = await unitOfMeasureRepo.findOne({
      where: { name: POUND },
    });
    if (!batchUom) {
      throw new Error('batch uom not found');
    }
    const servingUom = await unitOfMeasureRepo.findOne({
      where: { name: OUNCE },
    });
    if (!servingUom) {
      throw new Error('serving uom not found');
    }

    const dto: CreateRecipeDto = {
      name: 'New Recipe',
      batchResultQuantity: 5,
      batchResultUnitTypeId: batchUom.id,
      servingSizeQuantity: 2,
      servingSizeUnitTypeId: servingUom.id,
      subCategoryId: subCategory.id,
      isIngredient: false,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'category' }],
      'Requires category if assigning sub-category',
    );
  });

  it('fail validate create: invalid category / subcategory combination', async () => {
    const categories = await categoryRepo.find({
      relations: ['subCategories'],
    });
    if (categories.length < 2) {
      throw new Error('not enough categories for test');
    }

    const category1 = categories[0];
    const category2 = categories[1];
    if (!category2.subCategories || category2.subCategories.length === 0) {
      throw new Error('category2 subcategories not found');
    }

    const batchUom = await unitOfMeasureRepo.findOne({
      where: { name: POUND },
    });
    if (!batchUom) {
      throw new Error('batch uom not found');
    }
    const servingUom = await unitOfMeasureRepo.findOne({
      where: { name: OUNCE },
    });
    if (!servingUom) {
      throw new Error('serving uom not found');
    }

    const dto: CreateRecipeDto = {
      name: 'New Recipe',
      batchResultQuantity: 5,
      batchResultUnitTypeId: batchUom.id,
      servingSizeQuantity: 2,
      servingSizeUnitTypeId: servingUom.id,
      categoryId: category1.id,
      subCategoryId: category2.subCategories[0].id,
      isIngredient: false,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'subCategory' }],
      'Invalid category / subcategory combination',
    );
  });

  it('fail validate create: batchResultUnitTypeId and batchResultQuantity must both be populated', async () => {
    const servingUom = await unitOfMeasureRepo.findOne({
      where: { name: OUNCE },
    });
    if (!servingUom) {
      throw new Error('serving uom not found');
    }
    const batchUom = await unitOfMeasureRepo.findOne({
      where: { name: POUND },
    });
    if (!batchUom) {
      throw new Error('batch uom not found');
    }

    const dto: CreateRecipeDto = {
      name: 'New Recipe',
      batchResultUnitTypeId: batchUom.id,
      servingSizeQuantity: 2,
      servingSizeUnitTypeId: servingUom.id,
      isIngredient: false,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'batchResultUnitTypeId' }],
      'batchResultUnitTypeId and batchResultQuantity must both be populated',
    );
  });

  it('fail validate create: servingSizeQuantity and servingSizeUnitTypeId must both be populated', async () => {
    const batchUom = await unitOfMeasureRepo.findOne({
      where: { name: POUND },
    });
    if (!batchUom) {
      throw new Error('batch uom not found');
    }

    const dto: CreateRecipeDto = {
      name: 'New Recipe',
      batchResultQuantity: 5,
      batchResultUnitTypeId: batchUom.id,
      servingSizeQuantity: 2,
      isIngredient: false,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'servingSizeUnitTypeId' }],
      'servingSizeQuantity and servingSizeUnitTypeId must both be populated',
    );
  });

  it('fail validate create: serving size quantity cannot be 0', async () => {
    const batchUom = await unitOfMeasureRepo.findOne({
      where: { name: POUND },
    });
    if (!batchUom) {
      throw new Error('batch uom not found');
    }
    const servingUom = await unitOfMeasureRepo.findOne({
      where: { name: OUNCE },
    });
    if (!servingUom) {
      throw new Error('serving uom not found');
    }

    const dto: CreateRecipeDto = {
      name: 'New Recipe',
      batchResultQuantity: 5,
      batchResultUnitTypeId: batchUom.id,
      servingSizeQuantity: 0,
      servingSizeUnitTypeId: servingUom.id,
      isIngredient: false,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'servingSizeQuantity' }],
      'serving size quantity cannot be 0',
    );
  });

  it('fail validate create: batch result quantity cannot be 0', async () => {
    const batchUom = await unitOfMeasureRepo.findOne({
      where: { name: POUND },
    });
    if (!batchUom) {
      throw new Error('batch uom not found');
    }
    const servingUom = await unitOfMeasureRepo.findOne({
      where: { name: OUNCE },
    });
    if (!servingUom) {
      throw new Error('serving uom not found');
    }

    const dto: CreateRecipeDto = {
      name: 'New Recipe',
      batchResultQuantity: 0,
      batchResultUnitTypeId: batchUom.id,
      servingSizeQuantity: 2,
      servingSizeUnitTypeId: servingUom.id,
      isIngredient: false,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'batchResultQuantity' }],
      'batch result quantity cannot be 0',
    );
  });

  it('fail validate create: sales price cannot be 0', async () => {
    const batchUom = await unitOfMeasureRepo.findOne({
      where: { name: POUND },
    });
    if (!batchUom) {
      throw new Error('batch uom not found');
    }
    const servingUom = await unitOfMeasureRepo.findOne({
      where: { name: OUNCE },
    });
    if (!servingUom) {
      throw new Error('serving uom not found');
    }

    const dto: CreateRecipeDto = {
      name: 'New Recipe',
      batchResultQuantity: 5,
      batchResultUnitTypeId: batchUom.id,
      servingSizeQuantity: 2,
      servingSizeUnitTypeId: servingUom.id,
      salesPrice: -1,
      isIngredient: false,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'salesPrice' }],
      'sales price cannot be 0',
    );
  });

  it('fail validate create: duplicate ingredients', async () => {
    const inventoryItem = await inventoryItemRepo.findOne({
      where: { name: FOOD_A },
    });
    if (!inventoryItem) {
      throw new Error('inventory item not found');
    }
    const batchUom = await unitOfMeasureRepo.findOne({
      where: { name: POUND },
    });
    if (!batchUom) {
      throw new Error('batch uom not found');
    }
    const servingUom = await unitOfMeasureRepo.findOne({
      where: { name: OUNCE },
    });
    if (!servingUom) {
      throw new Error('serving uom not found');
    }

    const dto: CreateRecipeDto = {
      name: 'New Recipe',
      batchResultQuantity: 5,
      batchResultUnitTypeId: batchUom.id,
      servingSizeQuantity: 2,
      servingSizeUnitTypeId: servingUom.id,
      isIngredient: true,
      ingredients: [
        {
          createId: 'c1',
          ingredientInventoryItemId: inventoryItem.id,
          quantity: 3,
          quantityUnitTypeId: batchUom.id,
        },
        {
          createId: 'c2',
          ingredientInventoryItemId: inventoryItem.id,
          quantity: 4,
          quantityUnitTypeId: batchUom.id,
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'ingredients' }],
      'duplicate ingredient',
    );
  });

  it('fail validate create: nested ingredients validator errors: missing reference for ingredient', async () => {
    const batchUom = await unitOfMeasureRepo.findOne({
      where: { name: POUND },
    });
    if (!batchUom) {
      throw new Error('batch uom not found');
    }
    const servingUom = await unitOfMeasureRepo.findOne({
      where: { name: OUNCE },
    });
    if (!servingUom) {
      throw new Error('serving uom not found');
    }

    const dto: CreateRecipeDto = {
      name: 'New Recipe',
      batchResultQuantity: 5,
      batchResultUnitTypeId: batchUom.id,
      servingSizeQuantity: 2,
      servingSizeUnitTypeId: servingUom.id,
      isIngredient: true,
      ingredients: [
        {
          createId: 'c1',
          quantity: 3,
          quantityUnitTypeId: batchUom.id,
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [
        { prop: 'ingredients', id: 'c1' },
        { prop: 'ingredientInventoryItemId' },
      ],
      'missing reference for ingredient',
    );
  });

  it('fail validate create: nested ingredients validator errors: cannot provide both an inventory item and a recipe as an ingredient', async () => {
    const inventoryItem = await inventoryItemRepo.findOne({
      where: { name: FOOD_A },
    });
    if (!inventoryItem) {
      throw new Error('inventory item not found');
    }
    const recipe = await recipeRepo.findOne({ where: { name: REC_B } });
    if (!recipe) {
      throw new Error('recipe not found');
    }
    const batchUom = await unitOfMeasureRepo.findOne({
      where: { name: POUND },
    });
    if (!batchUom) {
      throw new Error('batch uom not found');
    }
    const servingUom = await unitOfMeasureRepo.findOne({
      where: { name: OUNCE },
    });
    if (!servingUom) {
      throw new Error('serving uom not found');
    }

    const dto: CreateRecipeDto = {
      name: 'New Recipe',
      batchResultQuantity: 5,
      batchResultUnitTypeId: batchUom.id,
      servingSizeQuantity: 2,
      servingSizeUnitTypeId: servingUom.id,
      isIngredient: true,
      ingredients: [
        {
          createId: 'c1',
          ingredientInventoryItemId: inventoryItem.id,
          ingredientRecipeId: recipe.id,
          quantity: 3,
          quantityUnitTypeId: batchUom.id,
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'ingredients', id: 'c1' }, { prop: 'ingredientInventoryItem' }],
      'cannot provide both an inventory item and a recipe as an ingredient',
    );
  });

  it('fail validate create: recipeIngredient isIngredient is false', async () => {
    const recipe = await recipeRepo.findOne({
      where: { name: REC_A },
    });
    if (!recipe) {
      throw new Error('recipe not found');
    }
    if (recipe.isIngredient) {
      throw new Error('recipe is already an ingredient, need one that is not');
    }
    const batchUom = await unitOfMeasureRepo.findOne({
      where: { name: POUND },
    });
    if (!batchUom) {
      throw new Error('batch uom not found');
    }
    const servingUom = await unitOfMeasureRepo.findOne({
      where: { name: OUNCE },
    });
    if (!servingUom) {
      throw new Error('serving uom not found');
    }

    const dto: CreateRecipeDto = {
      name: 'New Recipe',
      batchResultQuantity: 5,
      batchResultUnitTypeId: batchUom.id,
      servingSizeQuantity: 2,
      servingSizeUnitTypeId: servingUom.id,
      isIngredient: true,
      ingredients: [
        {
          createId: 'c1',
          ingredientRecipeId: recipe.id,
          quantity: 3,
          quantityUnitTypeId: batchUom.id,
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'ingredients' }],
      'this recipe is not set to be an ingredient',
    );
  });

  it('fail validate create: nested ingredients validator errors: quantity cannot be 0', async () => {
    const inventoryItem = await inventoryItemRepo.findOne({
      where: { name: FOOD_A },
    });
    if (!inventoryItem) {
      throw new Error('inventory item not found');
    }
    const batchUom = await unitOfMeasureRepo.findOne({
      where: { name: POUND },
    });
    if (!batchUom) {
      throw new Error('batch uom not found');
    }
    const servingUom = await unitOfMeasureRepo.findOne({
      where: { name: OUNCE },
    });
    if (!servingUom) {
      throw new Error('serving uom not found');
    }

    const dto: CreateRecipeDto = {
      name: 'New Recipe',
      batchResultQuantity: 5,
      batchResultUnitTypeId: batchUom.id,
      servingSizeQuantity: 2,
      servingSizeUnitTypeId: servingUom.id,
      isIngredient: true,
      ingredients: [
        {
          createId: 'c1',
          ingredientInventoryItemId: inventoryItem.id,
          quantity: 0,
          quantityUnitTypeId: batchUom.id,
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'ingredients', id: 'c1' }, { prop: 'quantity' }],
      'quantity cannot be 0',
    );
  });

  // Update Validation Tests
  it('successfully validate update: no validation errors', async () => {
    const recipeToUpdate = await recipeRepo.findOne({
      where: { name: REC_A },
      relations: ['ingredients', 'category', 'subCategory'],
    });
    if (!recipeToUpdate) {
      throw new Error('recipe not found');
    }

    const inventoryItem = await inventoryItemRepo.findOne({
      where: { name: FOOD_A },
    });
    if (!inventoryItem) {
      throw new Error('inventory item not found');
    }
    const batchUom = await unitOfMeasureRepo.findOne({
      where: { name: POUND },
    });
    if (!batchUom) {
      throw new Error('batch uom not found');
    }

    const dto: UpdateRecipeDto = {
      name: 'Updated Recipe Name',
      batchResultQuantity: 10,
      salesPrice: 15.99,
      ingredients:
        recipeToUpdate.ingredients && recipeToUpdate.ingredients.length > 0
          ? [
              {
                id: recipeToUpdate.ingredients[0].id,
                quantity: 8,
              },
              {
                createId: 'c1',
                ingredientInventoryItemId: inventoryItem.id,
                quantity: 5,
                quantityUnitTypeId: batchUom.id,
              },
            ]
          : [
              {
                createId: 'c1',
                ingredientInventoryItemId: inventoryItem.id,
                quantity: 5,
                quantityUnitTypeId: batchUom.id,
              },
            ],
    };

    const errors = await validator.validateUpdateNode(dto, recipeToUpdate.id);
    expect(errors).toBeNull();
  });

  it('fail validate update: name already exists', async () => {
    const recipes = await recipeRepo.find();
    if (recipes.length < 2) {
      throw new Error('Not enough recipes for test');
    }

    const recipeToUpdate = recipes[0];
    const existingRecipe = recipes[1];

    const dto: UpdateRecipeDto = {
      name: existingRecipe.name,
    };

    const errors = await validator.validateUpdateNode(dto, recipeToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'name' }],
      'Recipe with this name already exists.',
    );
  });

  it('fail validate update: requires category if assigning sub-category', async () => {
    const recipeToUpdate = await recipeRepo.findOne({
      where: { name: REC_A },
      relations: ['category'],
    });
    if (!recipeToUpdate) {
      throw new Error('recipe not found');
    }
    if (recipeToUpdate.category) {
      throw new Error('recipe already has category, need one without');
    }

    const subCategory = await subCategoryRepo.findOne({
      where: { name: REC_SUBCAT_1 },
    });
    if (!subCategory) {
      throw new Error('subcategory not found');
    }

    const dto: UpdateRecipeDto = {
      subCategoryId: subCategory.id,
    };

    const errors = await validator.validateUpdateNode(dto, recipeToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'category' }],
      'Requires category if assigning sub-category',
    );
  });

  it('fail validate update: invalid category / subcategory combination', async () => {
    const categories = await categoryRepo.find({
      relations: ['subCategories'],
    });
    if (categories.length < 2) {
      throw new Error('not enough categories for test');
    }

    const category1 = categories[0];
    const category2 = categories[1];
    if (!category2.subCategories || category2.subCategories.length === 0) {
      throw new Error('category2 subcategories not found');
    }

    const recipeToUpdate = await recipeRepo.findOne({
      where: { name: REC_A },
    });
    if (!recipeToUpdate) {
      throw new Error('recipe not found');
    }

    const dto: UpdateRecipeDto = {
      categoryId: category1.id,
      subCategoryId: category2.subCategories[0].id,
    };

    const errors = await validator.validateUpdateNode(dto, recipeToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'subCategory' }],
      'Invalid category / subcategory combination',
    );
  });

  it('fail validate update: batch result quantity cannot be 0', async () => {
    const recipeToUpdate = await recipeRepo.findOne({ where: { name: REC_A } });
    if (!recipeToUpdate) {
      throw new Error('recipe not found');
    }

    const dto: UpdateRecipeDto = {
      batchResultQuantity: 0,
    };

    const errors = await validator.validateUpdateNode(dto, recipeToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'batchResultQuantity' }],
      'batch result quantity cannot be 0',
    );
  });

  it('fail validate update: sales price cannot be 0', async () => {
    const recipeToUpdate = await recipeRepo.findOne({ where: { name: REC_A } });
    if (!recipeToUpdate) {
      throw new Error('recipe not found');
    }

    const dto: UpdateRecipeDto = {
      salesPrice: -1,
    };

    const errors = await validator.validateUpdateNode(dto, recipeToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'salesPrice' }],
      'sales price cannot be 0',
    );
  });

  it('fail validate update: duplicate ingredients', async () => {
    const recipeToUpdate = await recipeRepo.findOne({
      where: { name: REC_A },
      relations: ['ingredients'],
    });
    if (!recipeToUpdate) {
      throw new Error('recipe not found');
    }

    const inventoryItem = await inventoryItemRepo.findOne({
      where: { name: FOOD_A },
    });
    if (!inventoryItem) {
      throw new Error('inventory item not found');
    }
    const batchUom = await unitOfMeasureRepo.findOne({
      where: { name: POUND },
    });
    if (!batchUom) {
      throw new Error('batch uom not found');
    }

    const dto: UpdateRecipeDto = {
      ingredients: [
        {
          createId: 'c1',
          ingredientInventoryItemId: inventoryItem.id,
          quantity: 3,
          quantityUnitTypeId: batchUom.id,
        },
        {
          createId: 'c2',
          ingredientInventoryItemId: inventoryItem.id,
          quantity: 4,
          quantityUnitTypeId: batchUom.id,
        },
      ],
    };

    const errors = await validator.validateUpdateNode(dto, recipeToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'ingredients' }],
      'duplicate ingredient',
    );
  });

  it('fail validate update: nested ingredients validator errors: missing reference for ingredient', async () => {
    const recipeToUpdate = await recipeRepo.findOne({ where: { name: REC_A } });
    if (!recipeToUpdate) {
      throw new Error('recipe not found');
    }

    const batchUom = await unitOfMeasureRepo.findOne({
      where: { name: POUND },
    });
    if (!batchUom) {
      throw new Error('batch uom not found');
    }

    const dto: UpdateRecipeDto = {
      ingredients: [
        {
          createId: 'c1',
          quantity: 3,
          quantityUnitTypeId: batchUom.id,
        },
      ],
    };

    const errors = await validator.validateUpdateNode(dto, recipeToUpdate.id);
    expectValidationMessage(
      errors,
      [
        { prop: 'ingredients', id: 'c1' },
        { prop: 'ingredientInventoryItemId' },
      ],
      'missing reference for ingredient',
    );
  });

  it('fail validate update: nested ingredients validator errors: cannot provide both an inventory item and a recipe as an ingredient', async () => {
    const recipeToUpdate = await recipeRepo.findOne({ where: { name: REC_A } });
    if (!recipeToUpdate) {
      throw new Error('recipe not found');
    }

    const inventoryItem = await inventoryItemRepo.findOne({
      where: { name: FOOD_A },
    });
    if (!inventoryItem) {
      throw new Error('inventory item not found');
    }
    const ingredientRecipe = await recipeRepo.findOne({
      where: { name: REC_B },
    });
    if (!ingredientRecipe) {
      throw new Error('ingredient recipe not found');
    }
    const batchUom = await unitOfMeasureRepo.findOne({
      where: { name: POUND },
    });
    if (!batchUom) {
      throw new Error('batch uom not found');
    }

    const dto: UpdateRecipeDto = {
      ingredients: [
        {
          createId: 'c1',
          ingredientInventoryItemId: inventoryItem.id,
          ingredientRecipeId: ingredientRecipe.id,
          quantity: 3,
          quantityUnitTypeId: batchUom.id,
        },
      ],
    };

    const errors = await validator.validateUpdateNode(dto, recipeToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'ingredients', id: 'c1' }, { prop: 'ingredientInventoryItem' }],
      'cannot provide both an inventory item and a recipe as an ingredient',
    );
  });

  it('fail validate update: nested ingredients validator errors: quantity cannot be 0', async () => {
    const recipeToUpdate = await recipeRepo.findOne({ where: { name: REC_A } });
    if (!recipeToUpdate) {
      throw new Error('recipe not found');
    }

    const inventoryItem = await inventoryItemRepo.findOne({
      where: { name: FOOD_A },
    });
    if (!inventoryItem) {
      throw new Error('inventory item not found');
    }
    const batchUom = await unitOfMeasureRepo.findOne({
      where: { name: POUND },
    });
    if (!batchUom) {
      throw new Error('batch uom not found');
    }

    const dto: UpdateRecipeDto = {
      ingredients: [
        {
          createId: 'c1',
          ingredientInventoryItemId: inventoryItem.id,
          quantity: 0,
          quantityUnitTypeId: batchUom.id,
        },
      ],
    };

    const errors = await validator.validateUpdateNode(dto, recipeToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'ingredients', id: 'c1' }, { prop: 'quantity' }],
      'quantity cannot be 0',
    );
  });

  it('fail validate update: recipeIngredient isIngredient is false', async () => {
    const recipeToUpdate = await recipeRepo.findOne({ where: { name: REC_A } });
    if (!recipeToUpdate) {
      throw new Error('recipe not found');
    }

    const recipe = await recipeRepo.findOne({
      where: { isIngredient: false },
    });
    if (!recipe) {
      throw new Error('recipe not found');
    }
    if (recipe.isIngredient) {
      throw new Error('recipe is already an ingredient, need one that is not');
    }
    const batchUom = await unitOfMeasureRepo.findOne({
      where: { name: POUND },
    });
    if (!batchUom) {
      throw new Error('batch uom not found');
    }

    const dto: UpdateRecipeDto = {
      ingredients: [
        {
          createId: 'c1',
          ingredientRecipeId: recipe.id,
          quantity: 3,
          quantityUnitTypeId: batchUom.id,
        },
      ],
    };

    const errors = await validator.validateUpdateNode(dto, recipeToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'ingredients', id: 'c1' }, { prop: 'ingredientRecipe' }],
      'this recipe is not set to be an ingredient',
    );
  });

  it('fail validate update: nested ingredients validator errors: recipe cannot add itself as an ingredient', async () => {
    const recipeToUpdate = await recipeRepo.findOne({
      where: { name: REC_A },
      relations: ['ingredients'],
    });
    if (!recipeToUpdate) {
      throw new Error('recipe not found');
    }

    const batchUom = await unitOfMeasureRepo.findOne({
      where: { name: POUND },
    });
    if (!batchUom) {
      throw new Error('batch uom not found');
    }

    const dto: UpdateRecipeDto = {
      ingredients: [
        {
          createId: 'c1',
          ingredientRecipeId: recipeToUpdate.id,
          quantity: 3,
          quantityUnitTypeId: batchUom.id,
        },
      ],
    };

    const errors = await validator.validateUpdateNode(dto, recipeToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'ingredients', id: 'c1' }, { prop: 'ingredientRecipe' }],
      'recipe cannot add itself as an ingredient',
    );
  });
});
