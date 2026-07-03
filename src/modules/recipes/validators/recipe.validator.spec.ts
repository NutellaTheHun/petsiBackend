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
import { NestedCreateRecipeIngredientDto } from '../dto/recipe-ingredient/nested-create-recipe-ingredient.dto';
import { CreateRecipeDto } from '../dto/recipe/create-recipe.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { Recipe } from '../entities/recipe.entity';
import { recipeToUpdateDto } from '../utils/entity-transformers/recipe.dto.transformer';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeValidator } from './recipe.valdiator';

const P = `t${Date.now()}`;

describe('recipe validator', () => {
    let testingUtil: RecipeTestUtil;
    let testCtx: DatabaseTestContext;

    let validator: RecipeValidator;

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
        validator = module.get<RecipeValidator>(RecipeValidator);

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
        const category = await categoryRepo.findOneOrFail({
            where: { id: categories[0].id },
            relations: ['subCategories'],
        });

        const dto: CreateRecipeDto = plainToInstance(CreateRecipeDto, {
            name: `${P}-new-recipe`,
            batchResultQuantity: 5,
            batchResultUnit: 'lb',
            servingSizeQuantity: 2,
            servingSizeUnit: 'oz',
            salesPrice: 10.99,
            categoryId: category.id,
            subCategoryId: category.subCategories[0].id,
            isIngredient: true,
            ingredients: [
                plainToInstance(CreateRecipeIngredientDto, {
                    createId: 'c1',
                    ingredientInventoryItemId: invItems[0].id,
                    quantity: 3,
                    unit: 'oz',
                }),
                plainToInstance(CreateRecipeIngredientDto, {
                    createId: 'c2',
                    ingredientInventoryItemId: invItems[1].id,
                    quantity: 4,
                    unit: 'oz',
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateRecipeDto = plainToInstance(CreateRecipeDto, {
            name: recipes[0].name,
            batchResultQuantity: 5,
            batchResultUnit: 'lb',
            servingSizeQuantity: 2,
            servingSizeUnit: 'oz',
            isIngredient: false,
            ingredients: [],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('fail validate create: requires category if assigning sub-category', async () => {
        const dto: CreateRecipeDto = plainToInstance(CreateRecipeDto, {
            name: `${P}-new-recipe-2`,
            batchResultQuantity: 5,
            batchResultUnit: 'lb',
            servingSizeQuantity: 2,
            servingSizeUnit: 'oz',
            subCategoryId: subCategories[0].id,
            isIngredient: false,
            ingredients: [],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['subCategory']),
        );
    });

    it('fail validate create: invalid category / subcategory combination', async () => {
        const dto: CreateRecipeDto = plainToInstance(CreateRecipeDto, {
            name: `${P}-new-recipe-3`,
            ingredients: [],
            batchResultQuantity: 5,
            batchResultUnit: 'lb',
            servingSizeQuantity: 2,
            servingSizeUnit: 'oz',
            categoryId: categories[0].id,
            subCategoryId: subCategories[2].id,
            isIngredient: false,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['subCategory']),
        );
    });

    it('fail validate create: batchResultUnit and batchResultQuantity must both be populated', async () => {
        const dto: CreateRecipeDto = plainToInstance(CreateRecipeDto, {
            name: `${P}-new-recipe-4`,
            ingredients: [],
            batchResultUnit: 'lb',
            servingSizeQuantity: 2,
            servingSizeUnit: 'oz',
            isIngredient: false,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['batchResultQuantity', 'batchResultUnit']),
        );
    });

    it('fail validate create: servingSizeQuantity and servingSizeUnit must both be populated', async () => {
        const dto: CreateRecipeDto = plainToInstance(CreateRecipeDto, {
            name: `${P}-new-recipe-5`,
            ingredients: [],
            batchResultQuantity: 5,
            batchResultUnit: 'lb',
            servingSizeQuantity: 2,
            isIngredient: false,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['servingSizeQuantity', 'servingSizeUnit']),
        );
    });

    it('fail validate create: serving size quantity cannot be 0', async () => {
        const dto: CreateRecipeDto = plainToInstance(CreateRecipeDto, {
            name: `${P}-new-recipe-6`,
            ingredients: [],
            batchResultQuantity: 5,
            batchResultUnit: 'lb',
            servingSizeQuantity: 0,
            servingSizeUnit: 'oz',
            isIngredient: false,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['servingSizeQuantity']),
        );
    });

    it('fail validate create: batch result quantity cannot be 0', async () => {
        const dto: CreateRecipeDto = plainToInstance(CreateRecipeDto, {
            name: `${P}-new-recipe-7`,
            ingredients: [],
            batchResultQuantity: 0,
            batchResultUnit: 'lb',
            servingSizeQuantity: 2,
            servingSizeUnit: 'oz',
            isIngredient: false,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['batchResultQuantity']),
        );
    });

    it('fail validate create: sales price cannot be 0', async () => {
        const dto: CreateRecipeDto = plainToInstance(CreateRecipeDto, {
            name: `${P}-new-recipe-8`,
            ingredients: [],
            batchResultQuantity: 5,
            batchResultUnit: 'lb',
            servingSizeQuantity: 2,
            servingSizeUnit: 'oz',
            salesPrice: -1,
            isIngredient: false,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['salesPrice']),
        );
    });

    it('fail validate create: duplicate ingredients', async () => {
        const dto: CreateRecipeDto = plainToInstance(CreateRecipeDto, {
            name: `${P}-new-recipe-9`,
            batchResultQuantity: 5,
            batchResultUnit: 'lb',
            servingSizeQuantity: 2,
            servingSizeUnit: 'oz',
            isIngredient: true,
            ingredients: [
                plainToInstance(CreateRecipeIngredientDto, {
                    createId: 'c1',
                    ingredientInventoryItemId: invItems[0].id,
                    quantity: 3,
                    unit: 'oz',
                }),
                plainToInstance(CreateRecipeIngredientDto, {
                    createId: 'c2',
                    ingredientInventoryItemId: invItems[0].id,
                    quantity: 4,
                    unit: 'oz',
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c1', 'c2'], ['ingredients']),
        );
    });

    it('fail validate create: nested ingredients validator errors: missing reference for ingredient', async () => {
        const dto: CreateRecipeDto = plainToInstance(CreateRecipeDto, {
            name: `${P}-new-recipe-10`,
            batchResultQuantity: 5,
            batchResultUnit: 'lb',
            servingSizeQuantity: 2,
            servingSizeUnit: 'oz',
            isIngredient: true,
            ingredients: [
                plainToInstance(CreateRecipeIngredientDto, {
                    createId: 'c1',
                    quantity: 3,
                    unit: 'oz',
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'ingredients', id: 'c1' },
            ],
            createValidationErrorPayload('ONLY_ONE', undefined, ['ingredientInventoryItem', 'ingredientRecipe']),
        );
    });

    it('fail validate create: nested ingredients validator errors: cannot provide both an inventory item and a recipe as an ingredient', async () => {
        const dto: CreateRecipeDto = plainToInstance(CreateRecipeDto, {
            name: `${P}-new-recipe-11`,
            batchResultQuantity: 5,
            batchResultUnit: 'lb',
            servingSizeQuantity: 2,
            servingSizeUnit: 'oz',
            isIngredient: true,
            ingredients: [
                plainToInstance(CreateRecipeIngredientDto, {
                    createId: 'c1',
                    ingredientInventoryItemId: invItems[0].id,
                    ingredientRecipeId: recipes[1].id,
                    quantity: 3,
                    unit: 'oz',
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [{ prop: 'ingredients', id: 'c1' }],
            createValidationErrorPayload('ONLY_ONE', undefined, ['ingredientInventoryItem', 'ingredientRecipe']),
        );
    });

    it('fail validate create: recipeIngredient isIngredient is false', async () => {
        const dto: CreateRecipeDto = plainToInstance(CreateRecipeDto, {
            name: `${P}-new-recipe-12`,
            batchResultQuantity: 5,
            batchResultUnit: 'lb',
            servingSizeQuantity: 2,
            servingSizeUnit: 'oz',
            isIngredient: true,
            ingredients: [
                plainToInstance(CreateRecipeIngredientDto, {
                    createId: 'c1',
                    ingredientRecipeId: recipes[2].id,
                    quantity: 3,
                    unit: 'oz',
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'ingredients', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['ingredientRecipe']),
        );
    });

    it('fail validate create: nested ingredients validator errors: quantity cannot be 0', async () => {
        const dto: CreateRecipeDto = plainToInstance(CreateRecipeDto, {
            name: `${P}-new-recipe-13`,
            batchResultQuantity: 5,
            batchResultUnit: 'lb',
            servingSizeQuantity: 2,
            servingSizeUnit: 'oz',
            isIngredient: true,
            ingredients: [
                plainToInstance(CreateRecipeIngredientDto, {
                    createId: 'c1',
                    ingredientInventoryItemId: invItems[0].id,
                    quantity: 0,
                    unit: 'oz',
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'ingredients', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']),
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const recipeToUpdate = await recipeRepo.findOneOrFail({
            where: { id: recipes[0].id },
            relations: ['producedMenuItem', 'ingredients', 'ingredients.ingredientInventoryItem', 'ingredients.ingredientRecipe', 'category', 'subCategory'],
        });

        const dto = recipeToUpdateDto(recipeToUpdate, {
            name: `${P}-updated-recipe-name`,
            batchResultQuantity: 10,
            batchResultUnit: 'g',
            servingSizeQuantity: 2,
            servingSizeUnit: 'oz',
            isIngredient: false,
            salesPrice: 15.99,
            categoryId: categories[0].id,
            subCategoryId: subCategories[0].id,
            ingredients: [
                plainToInstance(NestedCreateRecipeIngredientDto, {
                    createId: 'c1',
                    ingredientInventoryItemId: invItems[1].id,
                    quantity: 5,
                    unit: 'oz',
                }),
            ],
        });

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const recipeToUpdate = await recipeRepo.findOneOrFail({
            where: { id: recipes[0].id },
            relations: ['ingredients', 'ingredients.ingredientInventoryItem', 'ingredients.ingredientRecipe'],
        });

        const dto = recipeToUpdateDto(recipeToUpdate, {
            name: recipes[1].name,
        });

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('fail validate update: requires category if assigning sub-category', async () => {
        const recipeToUpdate = await recipeRepo.findOneOrFail({
            where: { id: recipes[0].id },
            relations: ['ingredients', 'ingredients.ingredientInventoryItem', 'ingredients.ingredientRecipe'],
        });

        const dto = recipeToUpdateDto(recipeToUpdate, {
            categoryId: null,
            subCategoryId: subCategories[0].id,
        });

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['subCategory']),
        );
    });

    it('fail validate update: invalid category / subcategory combination', async () => {
        const recipeToUpdate = await recipeRepo.findOneOrFail({
            where: { id: recipes[0].id },
            relations: ['ingredients', 'ingredients.ingredientInventoryItem', 'ingredients.ingredientRecipe'],
        });

        const dto = recipeToUpdateDto(recipeToUpdate, {
            categoryId: categories[0].id,
            subCategoryId: subCategories[2].id,
        });

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['subCategory']),
        );
    });

    it('fail validate update: batch result quantity cannot be 0', async () => {
        const recipeToUpdate = await recipeRepo.findOneOrFail({
            where: { id: recipes[0].id },
            relations: ['ingredients', 'ingredients.ingredientInventoryItem', 'ingredients.ingredientRecipe'],
        });

        const dto = recipeToUpdateDto(recipeToUpdate, {
            batchResultQuantity: 0,
        });

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['batchResultQuantity']),
        );
    });

    it('fail validate update: sales price cannot be 0', async () => {
        const recipeToUpdate = await recipeRepo.findOneOrFail({
            where: { id: recipes[0].id },
            relations: ['ingredients', 'ingredients.ingredientInventoryItem', 'ingredients.ingredientRecipe'],
        });

        const dto = recipeToUpdateDto(recipeToUpdate, {
            salesPrice: -1,
        });

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['salesPrice']),
        );
    });

    it('fail validate update: duplicate ingredients', async () => {
        const recipeToUpdate = await recipeRepo.findOneOrFail({
            where: { id: recipes[0].id },
            relations: ['ingredients', 'ingredients.ingredientInventoryItem', 'ingredients.ingredientRecipe'],
        });

        const dto = recipeToUpdateDto(recipeToUpdate, {
            ingredients: [
                plainToInstance(NestedCreateRecipeIngredientDto, {
                    createId: 'c1',
                    ingredientInventoryItemId: invItems[2].id,
                    quantity: 3,
                    unit: 'oz',
                }),
                plainToInstance(NestedCreateRecipeIngredientDto, {
                    createId: 'c2',
                    ingredientInventoryItemId: invItems[2].id,
                    quantity: 4,
                    unit: 'oz',
                }),
            ],
        });

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c1', 'c2'], ['ingredients']),
        );
    });

    it('fail validate update: nested ingredients validator errors: missing reference for ingredient', async () => {
        const recipeToUpdate = await recipeRepo.findOneOrFail({
            where: { id: recipes[0].id },
            relations: ['ingredients', 'ingredients.ingredientInventoryItem', 'ingredients.ingredientRecipe'],
        });

        const dto = recipeToUpdateDto(recipeToUpdate, {
            ingredients: [
                plainToInstance(NestedCreateRecipeIngredientDto, {
                    createId: 'c1',
                    quantity: 3,
                    unit: 'oz',
                }),
            ],
        });

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [
                { prop: 'ingredients', id: 'c1' },
            ],
            createValidationErrorPayload('ONLY_ONE', undefined, ['ingredientInventoryItem', 'ingredientRecipe']),
        );
    });

    it('fail validate update: nested ingredients validator errors: cannot provide both an inventory item and a recipe as an ingredient', async () => {
        const recipeToUpdate = await recipeRepo.findOneOrFail({
            where: { id: recipes[0].id },
            relations: ['ingredients', 'ingredients.ingredientInventoryItem', 'ingredients.ingredientRecipe'],
        });

        const dto = recipeToUpdateDto(recipeToUpdate, {
            ingredients: [
                plainToInstance(NestedCreateRecipeIngredientDto, {
                    createId: 'c1',
                    ingredientInventoryItemId: invItems[0].id,
                    ingredientRecipeId: recipes[1].id,
                    quantity: 3,
                    unit: 'oz',
                }),
            ],
        });

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'ingredients', id: 'c1' }],
            createValidationErrorPayload('ONLY_ONE', undefined, ['ingredientInventoryItem', 'ingredientRecipe']),
        );
    });

    it('fail validate update: nested ingredients validator errors: quantity cannot be 0', async () => {
        const recipeToUpdate = await recipeRepo.findOneOrFail({
            where: { id: recipes[0].id },
            relations: ['ingredients', 'ingredients.ingredientInventoryItem', 'ingredients.ingredientRecipe'],
        });

        const dto = recipeToUpdateDto(recipeToUpdate, {
            ingredients: [
                plainToInstance(NestedCreateRecipeIngredientDto, {
                    createId: 'c1',
                    ingredientInventoryItemId: invItems[1].id,
                    quantity: 0,
                    unit: 'oz',
                }),
            ],
        });

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'ingredients', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']),
        );
    });

    it('fail validate update: recipeIngredient isIngredient is false', async () => {
        const recipeToUpdate = await recipeRepo.findOneOrFail({
            where: { id: recipes[0].id },
            relations: ['ingredients', 'ingredients.ingredientInventoryItem', 'ingredients.ingredientRecipe'],
        });

        const dto = recipeToUpdateDto(recipeToUpdate, {
            ingredients: [
                plainToInstance(NestedCreateRecipeIngredientDto, {
                    createId: 'c1',
                    ingredientRecipeId: recipes[2].id,
                    quantity: 3,
                    unit: 'oz',
                }),
            ],
        });

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'ingredients', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['ingredientRecipe']),
        );
    });

    it('fail validate update: nested ingredients validator errors: recipe cannot add itself as an ingredient', async () => {
        const recipeToUpdate = await recipeRepo.findOneOrFail({
            where: { id: recipes[1].id },
            relations: ['ingredients', 'ingredients.ingredientInventoryItem', 'ingredients.ingredientRecipe'],
        });

        const dto = recipeToUpdateDto(recipeToUpdate, {
            ingredients: [
                plainToInstance(NestedCreateRecipeIngredientDto, {
                    createId: 'c1',
                    ingredientRecipeId: recipeToUpdate.id,
                    quantity: 3,
                    unit: 'oz',
                }),
            ],
            isIngredient: true,
        });

        const errors = await validator.validateDto(dto, recipeToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'ingredients', id: 'c1' }],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['ingredientRecipe']),
        );
    });
});
