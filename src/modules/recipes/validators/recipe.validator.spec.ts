import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { FOOD_A, FOOD_B } from '../../inventory-items/utils/constants';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { item_a } from '../../menu-items/utils/constants';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { GRAM, OUNCE, POUND } from '../../unit-of-measure/utils/constants';
import { CreateRecipeDto } from '../dto/recipe/create-recipe.dto';
import { UpdateRecipeDto } from '../dto/recipe/update-recipe-dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { Recipe } from '../entities/recipe.entity';
import { REC_A, REC_B, REC_CAT_A, REC_CAT_B, REC_SUBCAT_1 } from '../utils/constants';
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
    let menuItemRepo: Repository<MenuItem>;

    const findRecipe = async (name: string) => {
        return await recipeRepo.findOneOrFail({ where: { name }, relations: ['producedMenuItem', 'batchResultUnitType', 'servingSizeUnitType', 'ingredients', 'category', 'subCategory'] });
    }
    const findCategory = async (name: string) => {
        return await categoryRepo.findOneOrFail({ where: { name }, relations: ['subCategories'] });
    }
    const findSubCategory = async (name: string) => {
        return await subCategoryRepo.findOneOrFail({ where: { name } });
    }

    const findInventoryItem = async (name: string) => {
        return await inventoryItemRepo.findOneOrFail({ where: { name } });
    }

    const findUnitOfMeasure = async (name: string) => {
        return await unitOfMeasureRepo.findOneOrFail({ where: { name } });
    }

    const findMenuItem = async (name: string) => {
        return await menuItemRepo.findOneOrFail({ where: { name } });
    }


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
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined;
    });

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const category = await findCategory(REC_CAT_A);

        const food_a = await findInventoryItem(FOOD_A);
        const food_b = await findInventoryItem(FOOD_B);
        const batchUom = await findUnitOfMeasure(POUND);
        const servingUom = await findUnitOfMeasure(OUNCE);

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

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const batchUom = await findUnitOfMeasure(POUND);
        const servingUom = await findUnitOfMeasure(OUNCE);

        const dto: CreateRecipeDto = {
            name: REC_A,
            batchResultQuantity: 5,
            batchResultUnitTypeId: batchUom.id,
            servingSizeQuantity: 2,
            servingSizeUnitTypeId: servingUom.id,
            isIngredient: false,
            ingredients: [],
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [{ prop: 'name' }],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('fail validate create: requires category if assigning sub-category', async () => {
        const subCategory = await findSubCategory(REC_SUBCAT_1);
        const batchUom = await findUnitOfMeasure(POUND);
        const servingUom = await findUnitOfMeasure(OUNCE);

        const dto: CreateRecipeDto = {
            name: 'New Recipe',
            batchResultQuantity: 5,
            batchResultUnitTypeId: batchUom.id,
            servingSizeQuantity: 2,
            servingSizeUnitTypeId: servingUom.id,
            subCategoryId: subCategory.id,
            isIngredient: false,
            ingredients: [],
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['categoryId']),
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

        const batchUom = await findUnitOfMeasure(POUND);
        const servingUom = await findUnitOfMeasure(OUNCE);

        const dto: CreateRecipeDto = {
            name: 'New Recipe',
            ingredients: [],
            batchResultQuantity: 5,
            batchResultUnitTypeId: batchUom.id,
            servingSizeQuantity: 2,
            servingSizeUnitTypeId: servingUom.id,
            categoryId: category1.id,
            subCategoryId: category2.subCategories[0].id,
            isIngredient: false,
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['subCategoryId']),
        );
    });

    it('fail validate create: batchResultUnitTypeId and batchResultQuantity must both be populated', async () => {
        const servingUom = await findUnitOfMeasure(OUNCE);
        const batchUom = await findUnitOfMeasure(POUND);

        const dto: CreateRecipeDto = {
            name: 'New Recipe',
            ingredients: [],
            batchResultUnitTypeId: batchUom.id,
            servingSizeQuantity: 2,
            servingSizeUnitTypeId: servingUom.id,
            isIngredient: false,
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('MISSING_PROPERTY', undefined, ['batchResultUnitTypeId', 'batchResultQuantity']),
        );
    });

    it('fail validate create: servingSizeQuantity and servingSizeUnitTypeId must both be populated', async () => {
        const batchUom = await findUnitOfMeasure(POUND);

        const dto: CreateRecipeDto = {
            name: 'New Recipe',
            ingredients: [],
            batchResultQuantity: 5,
            batchResultUnitTypeId: batchUom.id,
            servingSizeQuantity: 2,
            isIngredient: false,
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [{ prop: 'servingSizeUnitTypeId' }],
            createValidationErrorPayload('MISSING_PROPERTY', undefined, ['servingSizeQuantity', 'servingSizeUnitTypeId']),
        );
    });

    it('fail validate create: serving size quantity cannot be 0', async () => {
        const batchUom = await findUnitOfMeasure(POUND);
        const servingUom = await findUnitOfMeasure(OUNCE);

        const dto: CreateRecipeDto = {
            name: 'New Recipe',
            ingredients: [],
            batchResultQuantity: 5,
            batchResultUnitTypeId: batchUom.id,
            servingSizeQuantity: 0,
            servingSizeUnitTypeId: servingUom.id,
            isIngredient: false,
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [{ prop: 'servingSizeQuantity' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['servingSizeQuantity']),
        );
    });

    it('fail validate create: batch result quantity cannot be 0', async () => {
        const batchUom = await findUnitOfMeasure(POUND);
        const servingUom = await findUnitOfMeasure(OUNCE);

        const dto: CreateRecipeDto = {
            name: 'New Recipe',
            ingredients: [],
            batchResultQuantity: 0,
            batchResultUnitTypeId: batchUom.id,
            servingSizeQuantity: 2,
            servingSizeUnitTypeId: servingUom.id,
            isIngredient: false,
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['batchResultQuantity']),
        );
    });

    it('fail validate create: sales price cannot be 0', async () => {
        const batchUom = await findUnitOfMeasure(POUND);
        const servingUom = await findUnitOfMeasure(OUNCE);

        const dto: CreateRecipeDto = {
            name: 'New Recipe',
            ingredients: [],
            batchResultQuantity: 5,
            batchResultUnitTypeId: batchUom.id,
            servingSizeQuantity: 2,
            servingSizeUnitTypeId: servingUom.id,
            salesPrice: -1,
            isIngredient: false,
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['salesPrice']),
        );
    });

    it('fail validate create: duplicate ingredients', async () => {
        const inventoryItem = await findInventoryItem(FOOD_A);
        const batchUom = await findUnitOfMeasure(POUND);
        const servingUom = await findUnitOfMeasure(OUNCE);

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

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c1', 'c2'], ['ingredients']),
        );
    });

    it('fail validate create: nested ingredients validator errors: missing reference for ingredient', async () => {
        const batchUom = await findUnitOfMeasure(POUND);
        const servingUom = await findUnitOfMeasure(OUNCE);

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

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'ingredients', id: 'c1' },
            ],
            createValidationErrorPayload('ONLY_ONE', undefined, ['ingredientInventoryItemId', 'ingredientRecipeId']),
        );
    });

    it('fail validate create: nested ingredients validator errors: cannot provide both an inventory item and a recipe as an ingredient', async () => {
        const inventoryItem = await findInventoryItem(FOOD_A);
        const recipe = await findRecipe(REC_B);
        const batchUom = await findUnitOfMeasure(POUND);
        const servingUom = await findUnitOfMeasure(OUNCE);

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

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [{ prop: 'ingredients', id: 'c1' }],
            createValidationErrorPayload('ONLY_ONE', undefined, ['ingredientInventoryItemId', 'ingredientRecipeId']),
        );
    });

    it('fail validate create: recipeIngredient isIngredient is false', async () => {
        const recipe = await findRecipe(REC_A);
        const batchUom = await findUnitOfMeasure(POUND);
        const servingUom = await findUnitOfMeasure(OUNCE);

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

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [{ prop: 'ingredients', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['ingredientRecipeId']),
        );
    });

    it('fail validate create: nested ingredients validator errors: quantity cannot be 0', async () => {
        const inventoryItem = await findInventoryItem(FOOD_A);
        const batchUom = await findUnitOfMeasure(POUND);
        const servingUom = await findUnitOfMeasure(OUNCE);

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

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [{ prop: 'ingredients', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']),
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const recipeToUpdate = await findRecipe(REC_A);
        const inventoryItem = await findInventoryItem(FOOD_A);
        const batchUom = await findUnitOfMeasure(POUND);
        const newProducedMenuItem = await findMenuItem(item_a);
        const newBatchUom = await findUnitOfMeasure(GRAM);
        const newServingUom = await findUnitOfMeasure(OUNCE);
        const newCategory = await findCategory(REC_CAT_A);

        const dto: UpdateRecipeDto = {
            name: 'Updated Recipe Name',
            batchResultQuantity: 10,
            batchResultUnitTypeId: newBatchUom.id,
            servingSizeQuantity: 2,
            servingSizeUnitTypeId: newServingUom.id,
            producedMenuItemId: newProducedMenuItem.id,
            isIngredient: false,
            salesPrice: 15.99,
            categoryId: newCategory.id,
            subCategoryId: newCategory.subCategories[0].id,
            ingredients:
                [
                    {
                        id: recipeToUpdate.ingredients[0].id,
                        quantity: 8,
                        quantityUnitTypeId: recipeToUpdate.ingredients[0].quantityUnitType.id,
                    },
                    {
                        createId: 'c1',
                        ingredientInventoryItemId: inventoryItem.id,
                        quantity: 5,
                        quantityUnitTypeId: batchUom.id,
                    },
                ]
        };

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const recipeToUpdate = await findRecipe(REC_A);
        if (!recipeToUpdate.producedMenuItem || !recipeToUpdate.batchResultUnitType || !recipeToUpdate.servingSizeUnitType || !recipeToUpdate.category || !recipeToUpdate.subCategory) {
            throw new Error('recipe not found');
        }
        const existingRecipe = await findRecipe(REC_B);

        const dto: UpdateRecipeDto = {
            name: existingRecipe.name,
            producedMenuItemId: recipeToUpdate.producedMenuItem.id ?? undefined,
            batchResultQuantity: recipeToUpdate.batchResultQuantity,
            batchResultUnitTypeId: recipeToUpdate.batchResultUnitType.id,
            servingSizeQuantity: recipeToUpdate.servingSizeQuantity,
            servingSizeUnitTypeId: recipeToUpdate.servingSizeUnitType.id,
            isIngredient: recipeToUpdate.isIngredient,
            ingredients: recipeToUpdate.ingredients.map(ingredient => ({
                id: ingredient.id,
                quantity: ingredient.quantity,
                quantityUnitTypeId: ingredient.quantityUnitType.id,
                ingredientInventoryItemId: ingredient.ingredientInventoryItem?.id ?? undefined,
                ingredientRecipeId: ingredient.ingredientRecipe?.id ?? undefined,
            })),
            categoryId: recipeToUpdate.category.id,
            subCategoryId: recipeToUpdate.subCategory.id,
            salesPrice: Number(recipeToUpdate.salesPrice) ?? undefined,
        };

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('fail validate update: requires category if assigning sub-category', async () => {
        const recipeToUpdate = await findRecipe(REC_A);
        if (!recipeToUpdate.producedMenuItem || !recipeToUpdate.batchResultUnitType || !recipeToUpdate.servingSizeUnitType) {
            throw new Error('recipe produced menu item, batch result unit type, or serving size unit type not found');
        }
        const subCategory = await findSubCategory(REC_SUBCAT_1);

        const dto: UpdateRecipeDto = {
            subCategoryId: subCategory.id,
            name: recipeToUpdate.name,
            producedMenuItemId: recipeToUpdate.producedMenuItem.id ?? undefined,
            batchResultQuantity: recipeToUpdate.batchResultQuantity,
            batchResultUnitTypeId: recipeToUpdate.batchResultUnitType.id,
            servingSizeQuantity: recipeToUpdate.servingSizeQuantity,
            servingSizeUnitTypeId: recipeToUpdate.servingSizeUnitType.id,
            isIngredient: recipeToUpdate.isIngredient,
            salesPrice: Number(recipeToUpdate.salesPrice) ?? undefined,
            categoryId: null,
            ingredients: recipeToUpdate.ingredients.map(ingredient => ({
                id: ingredient.id,
                quantity: ingredient.quantity,
                quantityUnitTypeId: ingredient.quantityUnitType.id,
                ingredientInventoryItemId: ingredient.ingredientInventoryItem?.id ?? undefined,
                ingredientRecipeId: ingredient.ingredientRecipe?.id ?? undefined,
            })),
        };

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['subCategory']),
        );
    });

    it('fail validate update: invalid category / subcategory combination', async () => {
        const category1 = await findCategory(REC_CAT_A);
        const category2 = await findCategory(REC_CAT_B);
        const recipeToUpdate = await findRecipe(REC_A);
        if (!recipeToUpdate.producedMenuItem || !recipeToUpdate.batchResultUnitType || !recipeToUpdate.servingSizeUnitType) {
            throw new Error('recipe produced menu item, batch result unit type, or serving size unit type not found');
        }

        const dto: UpdateRecipeDto = {
            categoryId: category1.id,
            subCategoryId: category2.subCategories[0].id,
            name: recipeToUpdate.name,
            producedMenuItemId: recipeToUpdate.producedMenuItem.id ?? undefined,
            batchResultQuantity: recipeToUpdate.batchResultQuantity,
            batchResultUnitTypeId: recipeToUpdate.batchResultUnitType.id,
            servingSizeQuantity: recipeToUpdate.servingSizeQuantity,
            servingSizeUnitTypeId: recipeToUpdate.servingSizeUnitType.id,
            isIngredient: recipeToUpdate.isIngredient,
            salesPrice: Number(recipeToUpdate.salesPrice) ?? undefined,
            ingredients: recipeToUpdate.ingredients.map(ingredient => ({
                id: ingredient.id,
                quantity: ingredient.quantity,
                quantityUnitTypeId: ingredient.quantityUnitType.id,
                ingredientInventoryItemId: ingredient.ingredientInventoryItem?.id ?? undefined,
                ingredientRecipeId: ingredient.ingredientRecipe?.id ?? undefined,
            })),
        };

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['subCategoryId']),
        );
    });

    it('fail validate update: batch result quantity cannot be 0', async () => {
        const recipeToUpdate = await findRecipe(REC_A);
        if (!recipeToUpdate.producedMenuItem || !recipeToUpdate.batchResultUnitType || !recipeToUpdate.servingSizeUnitType || !recipeToUpdate.category || !recipeToUpdate.subCategory) {
            throw new Error('recipe produced menu item, batch result unit type, or serving size unit type not found');
        }

        const dto: UpdateRecipeDto = {
            categoryId: recipeToUpdate.category.id,
            subCategoryId: recipeToUpdate.subCategory.id,
            batchResultQuantity: 0,
            name: recipeToUpdate.name,
            producedMenuItemId: recipeToUpdate.producedMenuItem.id ?? undefined,
            batchResultUnitTypeId: recipeToUpdate.batchResultUnitType.id,
            servingSizeQuantity: recipeToUpdate.servingSizeQuantity,
            servingSizeUnitTypeId: recipeToUpdate.servingSizeUnitType.id,
            isIngredient: recipeToUpdate.isIngredient,
            salesPrice: Number(recipeToUpdate.salesPrice) ?? undefined,
            ingredients: recipeToUpdate.ingredients.map(ingredient => ({
                id: ingredient.id,
                quantity: ingredient.quantity,
                quantityUnitTypeId: ingredient.quantityUnitType.id,
                ingredientInventoryItemId: ingredient.ingredientInventoryItem?.id ?? undefined,
                ingredientRecipeId: ingredient.ingredientRecipe?.id ?? undefined,
            })),
        };

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['batchResultQuantity']),
        );
    });

    it('fail validate update: sales price cannot be 0', async () => {
        const recipeToUpdate = await findRecipe(REC_A);
        if (!recipeToUpdate.producedMenuItem || !recipeToUpdate.batchResultUnitType || !recipeToUpdate.servingSizeUnitType || !recipeToUpdate.category || !recipeToUpdate.subCategory) {
            throw new Error('recipe produced menu item, batch result unit type, or serving size unit type not found');
        }

        const dto: UpdateRecipeDto = {
            categoryId: recipeToUpdate.category.id,
            subCategoryId: recipeToUpdate.subCategory.id,
            salesPrice: -1,
            name: recipeToUpdate.name,
            producedMenuItemId: recipeToUpdate.producedMenuItem.id ?? undefined,
            batchResultQuantity: recipeToUpdate.batchResultQuantity,
            batchResultUnitTypeId: recipeToUpdate.batchResultUnitType.id,
            servingSizeQuantity: recipeToUpdate.servingSizeQuantity,
            servingSizeUnitTypeId: recipeToUpdate.servingSizeUnitType.id,
            isIngredient: recipeToUpdate.isIngredient,
            ingredients: recipeToUpdate.ingredients.map(ingredient => ({
                id: ingredient.id,
                quantity: ingredient.quantity,
                quantityUnitTypeId: ingredient.quantityUnitType.id,
                ingredientInventoryItemId: ingredient.ingredientInventoryItem?.id ?? undefined,
                ingredientRecipeId: ingredient.ingredientRecipe?.id ?? undefined,
            })),
        };

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['salesPrice']),
        );
    });

    it('fail validate update: duplicate ingredients', async () => {
        const recipeToUpdate = await findRecipe(REC_A);
        if (!recipeToUpdate.producedMenuItem || !recipeToUpdate.batchResultUnitType || !recipeToUpdate.servingSizeUnitType || !recipeToUpdate.category || !recipeToUpdate.subCategory) {
            throw new Error('recipe produced menu item, batch result unit type, or serving size unit type not found');
        }
        const inventoryItem = await findInventoryItem(FOOD_A);
        const batchUom = await findUnitOfMeasure(POUND);

        const dto: UpdateRecipeDto = {
            name: recipeToUpdate.name,
            producedMenuItemId: recipeToUpdate.producedMenuItem.id ?? undefined,
            batchResultQuantity: recipeToUpdate.batchResultQuantity,
            batchResultUnitTypeId: recipeToUpdate.batchResultUnitType.id,
            servingSizeQuantity: recipeToUpdate.servingSizeQuantity,
            servingSizeUnitTypeId: recipeToUpdate.servingSizeUnitType.id,
            isIngredient: recipeToUpdate.isIngredient,
            salesPrice: Number(recipeToUpdate.salesPrice) ?? undefined,
            categoryId: recipeToUpdate.category.id,
            subCategoryId: recipeToUpdate.subCategory.id,
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

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c1', 'c2'], ['ingredients']),
        );
    });

    it('fail validate update: nested ingredients validator errors: missing reference for ingredient', async () => {
        const recipeToUpdate = await findRecipe(REC_A);
        if (!recipeToUpdate.producedMenuItem || !recipeToUpdate.batchResultUnitType || !recipeToUpdate.servingSizeUnitType || !recipeToUpdate.category || !recipeToUpdate.subCategory) {
            throw new Error('recipe produced menu item, batch result unit type, or serving size unit type not found');
        }

        const batchUom = await findUnitOfMeasure(POUND);

        const dto: UpdateRecipeDto = {
            name: recipeToUpdate.name,
            producedMenuItemId: recipeToUpdate.producedMenuItem.id ?? undefined,
            batchResultQuantity: recipeToUpdate.batchResultQuantity,
            batchResultUnitTypeId: recipeToUpdate.batchResultUnitType.id,
            servingSizeQuantity: recipeToUpdate.servingSizeQuantity,
            servingSizeUnitTypeId: recipeToUpdate.servingSizeUnitType.id,
            isIngredient: recipeToUpdate.isIngredient,
            salesPrice: Number(recipeToUpdate.salesPrice) ?? undefined,
            categoryId: recipeToUpdate.category.id,
            subCategoryId: recipeToUpdate.subCategory.id,
            ingredients: [
                {
                    createId: 'c1',
                    quantity: 3,
                    quantityUnitTypeId: batchUom.id,
                },
            ],
        };

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'ingredients', id: 'c1' },
            ],
            createValidationErrorPayload('ONLY_ONE', undefined, ['ingredientInventoryItemId', 'ingredientRecipeId']),
        );
    });

    it('fail validate update: nested ingredients validator errors: cannot provide both an inventory item and a recipe as an ingredient', async () => {
        const recipeToUpdate = await findRecipe(REC_A);
        if (!recipeToUpdate.producedMenuItem || !recipeToUpdate.batchResultUnitType || !recipeToUpdate.servingSizeUnitType || !recipeToUpdate.category || !recipeToUpdate.subCategory) {
            throw new Error('recipe produced menu item, batch result unit type, or serving size unit type not found');
        }
        const inventoryItem = await findInventoryItem(FOOD_A);
        const ingredientRecipe = await findRecipe(REC_B);
        const batchUom = await findUnitOfMeasure(POUND);

        const dto: UpdateRecipeDto = {
            name: recipeToUpdate.name,
            producedMenuItemId: recipeToUpdate.producedMenuItem.id ?? undefined,
            batchResultQuantity: recipeToUpdate.batchResultQuantity,
            batchResultUnitTypeId: recipeToUpdate.batchResultUnitType.id,
            servingSizeQuantity: recipeToUpdate.servingSizeQuantity,
            servingSizeUnitTypeId: recipeToUpdate.servingSizeUnitType.id,
            isIngredient: recipeToUpdate.isIngredient,
            salesPrice: Number(recipeToUpdate.salesPrice) ?? undefined,
            categoryId: recipeToUpdate.category.id,
            subCategoryId: recipeToUpdate.subCategory.id,
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

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ONLY_ONE', undefined, ['ingredientInventoryItemId', 'ingredientRecipeId']),
        );
    });

    it('fail validate update: nested ingredients validator errors: quantity cannot be 0', async () => {
        const recipeToUpdate = await findRecipe(REC_A);
        if (!recipeToUpdate.producedMenuItem || !recipeToUpdate.batchResultUnitType || !recipeToUpdate.servingSizeUnitType || !recipeToUpdate.category || !recipeToUpdate.subCategory) {
            throw new Error('recipe produced menu item, batch result unit type, or serving size unit type not found');
        }
        const inventoryItem = await findInventoryItem(FOOD_A);
        const batchUom = await findUnitOfMeasure(POUND);

        const dto: UpdateRecipeDto = {
            subCategoryId: recipeToUpdate.subCategory.id,
            name: recipeToUpdate.name,
            producedMenuItemId: recipeToUpdate.producedMenuItem.id ?? undefined,
            batchResultQuantity: recipeToUpdate.batchResultQuantity,
            batchResultUnitTypeId: recipeToUpdate.batchResultUnitType.id,
            servingSizeQuantity: recipeToUpdate.servingSizeQuantity,
            servingSizeUnitTypeId: recipeToUpdate.servingSizeUnitType.id,
            isIngredient: recipeToUpdate.isIngredient,
            salesPrice: Number(recipeToUpdate.salesPrice) ?? undefined,
            categoryId: recipeToUpdate.category.id,
            ingredients: [
                {
                    createId: 'c1',
                    ingredientInventoryItemId: inventoryItem.id,
                    quantity: 0,
                    quantityUnitTypeId: batchUom.id,
                },
            ],
        };

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'ingredients', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']),
        );
    });

    it('fail validate update: recipeIngredient isIngredient is false', async () => {
        const recipeToUpdate = await findRecipe(REC_A);
        if (!recipeToUpdate.producedMenuItem || !recipeToUpdate.batchResultUnitType || !recipeToUpdate.servingSizeUnitType || !recipeToUpdate.category || !recipeToUpdate.subCategory) {
            throw new Error('recipe produced menu item, batch result unit type, or serving size unit type not found');
        }
        const recipe = await findRecipe(REC_B);
        if (recipe.isIngredient) {
            throw new Error('recipe is already an ingredient, need one that is not');
        }
        const batchUom = await findUnitOfMeasure(POUND);

        const dto: UpdateRecipeDto = {
            name: recipeToUpdate.name,
            producedMenuItemId: recipeToUpdate.producedMenuItem.id ?? undefined,
            batchResultQuantity: recipeToUpdate.batchResultQuantity,
            batchResultUnitTypeId: recipeToUpdate.batchResultUnitType.id,
            servingSizeQuantity: recipeToUpdate.servingSizeQuantity,
            servingSizeUnitTypeId: recipeToUpdate.servingSizeUnitType.id,
            isIngredient: recipeToUpdate.isIngredient,
            salesPrice: Number(recipeToUpdate.salesPrice) ?? undefined,
            categoryId: recipeToUpdate.category.id,
            subCategoryId: recipeToUpdate.subCategory.id,
            ingredients: [
                {
                    createId: 'c1',
                    ingredientRecipeId: recipe.id,
                    quantity: 3,
                    quantityUnitTypeId: batchUom.id,
                },
            ],
        };

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['ingredientRecipeId']),
        );
    });

    it('fail validate update: nested ingredients validator errors: recipe cannot add itself as an ingredient', async () => {
        const recipeToUpdate = await findRecipe(REC_A);
        if (!recipeToUpdate.producedMenuItem || !recipeToUpdate.batchResultUnitType || !recipeToUpdate.servingSizeUnitType || !recipeToUpdate.category || !recipeToUpdate.subCategory) {
            throw new Error('recipe produced menu item, batch result unit type, or serving size unit type not found');
        }

        const batchUom = await findUnitOfMeasure(POUND);

        const dto: UpdateRecipeDto = {
            name: recipeToUpdate.name,
            producedMenuItemId: recipeToUpdate.producedMenuItem.id ?? undefined,
            batchResultQuantity: recipeToUpdate.batchResultQuantity,
            batchResultUnitTypeId: recipeToUpdate.batchResultUnitType.id,
            servingSizeQuantity: recipeToUpdate.servingSizeQuantity,
            servingSizeUnitTypeId: recipeToUpdate.servingSizeUnitType.id,
            isIngredient: recipeToUpdate.isIngredient,
            salesPrice: Number(recipeToUpdate.salesPrice) ?? undefined,
            categoryId: recipeToUpdate.category.id,
            subCategoryId: recipeToUpdate.subCategory.id,
            ingredients: [
                {
                    createId: 'c1',
                    ingredientRecipeId: recipeToUpdate.id,
                    quantity: 3,
                    quantityUnitTypeId: batchUom.id,
                },
            ],
        };

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'ingredients', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['ingredientRecipeId']),
        );
    });
});
