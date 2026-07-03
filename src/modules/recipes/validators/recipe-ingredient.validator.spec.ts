import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItemCategory } from '../../inventory-items/entities/inventory-item-category.entity';
import { InventoryItemVendor } from '../../inventory-items/entities/inventory-item-vendor.entity';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { CreateRecipeIngredientDto } from '../dto/recipe-ingredient/create-recipe-ingredient.dto';
import { UpdateRecipeIngredientDto } from '../dto/recipe-ingredient/update-recipe-ingedient.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { Recipe } from '../entities/recipe.entity';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeIngredientValidator } from './recipe-ingredient.validator';

const P = `t${Date.now()}`;

describe('recipe ingredient validator', () => {
    let testingUtil: RecipeTestUtil;
    let testCtx: DatabaseTestContext;

    let validator: RecipeIngredientValidator;

    let recipeRepo: Repository<Recipe>;
    let categoryRepo: Repository<RecipeCategory>;
    let subCategoryRepo: Repository<RecipeSubCategory>;
    let ingredientRepo: Repository<RecipeIngredient>;
    let invCategoryRepo: Repository<InventoryItemCategory>;
    let invVendorRepo: Repository<InventoryItemVendor>;
    let invItemRepo: Repository<InventoryItem>;

    let categories: RecipeCategory[];
    let subCategories: RecipeSubCategory[];
    let recipes: Recipe[];
    let invCategories: InventoryItemCategory[];
    let invVendors: InventoryItemVendor[];
    let invItems: InventoryItem[];
    let ingredients: RecipeIngredient[];

    beforeAll(async () => {
        const module: TestingModule = await getRecipeTestingModule();
        testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
        validator = module.get<RecipeIngredientValidator>(RecipeIngredientValidator);

        recipeRepo = module.get(getRepositoryToken(Recipe));
        categoryRepo = module.get(getRepositoryToken(RecipeCategory));
        subCategoryRepo = module.get(getRepositoryToken(RecipeSubCategory));
        ingredientRepo = module.get(getRepositoryToken(RecipeIngredient));
        invCategoryRepo = module.get(getRepositoryToken(InventoryItemCategory));
        invVendorRepo = module.get(getRepositoryToken(InventoryItemVendor));
        invItemRepo = module.get(getRepositoryToken(InventoryItem));

        ({ categories, subCategories, recipes, invCategories, invVendors, invItems, ingredients } =
            await testingUtil.seedIngredients(P));
    });

    afterAll(async () => {
        await ingredientRepo.delete(ingredients.map((i) => i.id));
        await recipeRepo.delete(recipes.map((r) => r.id));
        await subCategoryRepo.delete(subCategories.map((s) => s.id));
        await categoryRepo.delete(categories.map((c) => c.id));
        await invItemRepo.delete(invItems.map((i) => i.id));
        await invVendorRepo.delete(invVendors.map((v) => v.id));
        await invCategoryRepo.delete(invCategories.map((c) => c.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const dto: CreateRecipeIngredientDto = plainToInstance(CreateRecipeIngredientDto, {
            parentRecipeId: recipes[3].id,
            ingredientInventoryItemId: invItems[0].id,
            quantity: 5,
            unit: 'oz',
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: missing reference for ingredient', async () => {
        const dto: CreateRecipeIngredientDto = plainToInstance(CreateRecipeIngredientDto, {
            parentRecipeId: recipes[3].id,
            quantity: 5,
            unit: 'oz',
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ONLY_ONE', undefined, ['ingredientInventoryItem', 'ingredientRecipe']),
        );
    });

    it('fail validate create: cannot provide both an inventory item and a recipe as an ingredient', async () => {
        const dto: CreateRecipeIngredientDto = plainToInstance(CreateRecipeIngredientDto, {
            parentRecipeId: recipes[3].id,
            ingredientInventoryItemId: invItems[0].id,
            ingredientRecipeId: recipes[1].id,
            quantity: 5,
            unit: 'oz',
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ONLY_ONE', undefined, ['ingredientInventoryItem', 'ingredientRecipe']),
        );
    });

    it('fail validate create: quantity cannot be 0', async () => {
        const dto: CreateRecipeIngredientDto = plainToInstance(CreateRecipeIngredientDto, {
            parentRecipeId: recipes[3].id,
            ingredientInventoryItemId: invItems[0].id,
            quantity: 0,
            unit: 'oz',
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']),
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const dto: UpdateRecipeIngredientDto = plainToInstance(UpdateRecipeIngredientDto, {
            quantity: 10,
            ingredientInventoryItemId: invItems[1].id,
            unit: 'oz',
        });

        const errors = await validator.validateDto(dto, ingredients[0].id);
        expect(errors).toBeNull();
    });

    it('fail validate update: missing reference for ingredient', async () => {
        const ingredientToUpdate = ingredients[0];

        const dto: UpdateRecipeIngredientDto = plainToInstance(UpdateRecipeIngredientDto, {
            quantity: 1,
            unit: 'oz',
        });

        const errors = await validator.validateDto(dto, ingredientToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ONLY_ONE', undefined, ['ingredientInventoryItem', 'ingredientRecipe']),
        );
    });

    it('fail validate update: cannot provide both an inventory item and a recipe as an ingredient', async () => {
        const ingredientToUpdate = ingredients[0];

        const dto: UpdateRecipeIngredientDto = plainToInstance(UpdateRecipeIngredientDto, {
            ingredientInventoryItemId: invItems[0].id,
            ingredientRecipeId: recipes[1].id,
            quantity: 1,
            unit: 'oz',
        });

        const errors = await validator.validateDto(dto, ingredientToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ONLY_ONE', undefined, ['ingredientInventoryItem', 'ingredientRecipe']),
        );
    });

    it('fail validate update: quantity cannot be 0', async () => {
        const ingredientToUpdate = ingredients[0];

        const dto: UpdateRecipeIngredientDto = plainToInstance(UpdateRecipeIngredientDto, {
            quantity: 0,
            unit: 'oz',
            ingredientInventoryItemId: invItems[0].id,
        });

        const errors = await validator.validateDto(dto, ingredientToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']),
        );
    });

    it('fail validate update: recipe cannot add itself as an ingredient', async () => {
        const ingredientToUpdate = await ingredientRepo.findOneOrFail({
            where: { id: ingredients[0].id },
            relations: ['parentRecipe'],
        });

        const dto: UpdateRecipeIngredientDto = plainToInstance(UpdateRecipeIngredientDto, {
            ingredientRecipeId: ingredientToUpdate.parentRecipe.id,
            quantity: 1,
            unit: 'oz',
        });

        const errors = await validator.validateDto(dto, ingredientToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['ingredientRecipe']),
        );
    });
});
