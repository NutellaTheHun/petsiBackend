import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { FOOD_A } from '../../inventory-items/utils/constants';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { GRAM, POUND } from '../../unit-of-measure/utils/constants';
import { CreateRecipeIngredientDto } from '../dto/recipe-ingredient/create-recipe-ingredient.dto';
import { UpdateRecipeIngredientDto } from '../dto/recipe-ingredient/update-recipe-ingedient.dto';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { Recipe } from '../entities/recipe.entity';
import { REC_A, REC_B } from '../utils/constants';
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

    const findRecipe = async (name: string) => {
        return await recipeRepo.findOneOrFail({ where: { name }, relations: ['ingredients'] });
    }

    const findInventoryItem = async (name: string) => {
        return await inventoryItemRepo.findOneOrFail({ where: { name }, relations: ['sizes', 'sizes.package', 'sizes.measureType'] });
    }

    const findUnitOfMeasure = async (name: string) => {
        return await unitOfMeasureRepo.findOneOrFail({ where: { name } });
    }

    const findIngredient = async () => {
        return await ingredientRepo.findOneOrFail({ where: {}, relations: ['parentRecipe', 'quantityUnitType', 'ingredientInventoryItem', 'ingredientRecipe'] });
    }

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

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const parentRecipe = await findRecipe(REC_A);
        const inventoryItem = await findInventoryItem(FOOD_A);
        const uom = await findUnitOfMeasure(POUND);

        const dto: CreateRecipeIngredientDto = plainToInstance(CreateRecipeIngredientDto, {
            parentRecipeId: parentRecipe.id,
            ingredientInventoryItemId: inventoryItem.id,
            quantity: 5,
            quantityUnitTypeId: uom.id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: missing reference for ingredient', async () => {
        const parentRecipe = await findRecipe(REC_A);
        const uom = await findUnitOfMeasure(POUND);

        const dto: CreateRecipeIngredientDto = plainToInstance(CreateRecipeIngredientDto, {
            parentRecipeId: parentRecipe.id,
            quantity: 5,
            quantityUnitTypeId: uom.id,
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
        const parentRecipe = await findRecipe(REC_A);
        const inventoryItem = await findInventoryItem(FOOD_A);
        const ingredientRecipe = await findRecipe(REC_B);
        const uom = await findUnitOfMeasure(POUND);

        const dto: CreateRecipeIngredientDto = plainToInstance(CreateRecipeIngredientDto, {
            parentRecipeId: parentRecipe.id,
            ingredientInventoryItemId: inventoryItem.id,
            ingredientRecipeId: ingredientRecipe.id,
            quantity: 5,
            quantityUnitTypeId: uom.id,
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
        const parentRecipe = await findRecipe(REC_A);
        const inventoryItem = await findInventoryItem(FOOD_A);
        const uom = await findUnitOfMeasure(POUND);

        const dto: CreateRecipeIngredientDto = plainToInstance(CreateRecipeIngredientDto, {
            parentRecipeId: parentRecipe.id,
            ingredientInventoryItemId: inventoryItem.id,
            quantity: 0,
            quantityUnitTypeId: uom.id,
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
        const ingredientToUpdate = await findIngredient();
        const newInventoryItem = await findInventoryItem(FOOD_A);
        const newBatchUom = await findUnitOfMeasure(GRAM);

        const dto: UpdateRecipeIngredientDto = plainToInstance(UpdateRecipeIngredientDto, {
            quantity: 10,
            ingredientInventoryItemId: newInventoryItem.id,
            quantityUnitTypeId: newBatchUom.id,
        });

        const errors = await validator.validateDto(
            dto,
            ingredientToUpdate.id,
        );
        expect(errors).toBeNull();
    });

    it('fail validate update: missing reference for ingredient', async () => {
        const ingredientToUpdate = await findIngredient();

        const dto: UpdateRecipeIngredientDto = plainToInstance(UpdateRecipeIngredientDto, {
            quantity: 1,
            quantityUnitTypeId: ingredientToUpdate.quantityUnitType.id,
        });

        const errors = await validator.validateDto(
            dto,
            ingredientToUpdate.id,
        );
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ONLY_ONE', undefined, ['ingredientInventoryItem', 'ingredientRecipe']),
        );
    });

    it('fail validate update: cannot provide both an inventory item and a recipe as an ingredient', async () => {
        const ingredientToUpdate = await findIngredient();
        const inventoryItem = await findInventoryItem(FOOD_A);
        const recipe = await findRecipe(REC_B);

        const dto: UpdateRecipeIngredientDto = plainToInstance(UpdateRecipeIngredientDto, {
            ingredientInventoryItemId: inventoryItem.id,
            ingredientRecipeId: recipe.id,
            quantity: 1,
            quantityUnitTypeId: ingredientToUpdate.quantityUnitType.id,
        });

        const errors = await validator.validateDto(
            dto,
            ingredientToUpdate.id,
        );
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ONLY_ONE', undefined, ['ingredientInventoryItem', 'ingredientRecipe']),
        );
    });

    it('fail validate update: quantity cannot be 0', async () => {
        const ingredientToUpdate = await findIngredient();

        const dto: UpdateRecipeIngredientDto = plainToInstance(UpdateRecipeIngredientDto, {
            quantity: 0,
            quantityUnitTypeId: ingredientToUpdate.quantityUnitType.id,
            ingredientInventoryItemId: ingredientToUpdate.ingredientInventoryItem?.id ?? undefined,
            ingredientRecipeId: ingredientToUpdate.ingredientRecipe?.id ?? undefined,
        });

        const errors = await validator.validateDto(
            dto,
            ingredientToUpdate.id,
        );
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['quantity']),
        );
    });

    it('fail validate update: recipe cannot add itself as an ingredient', async () => {
        const ingredientToUpdate = await findIngredient();

        const dto: UpdateRecipeIngredientDto = plainToInstance(UpdateRecipeIngredientDto, {
            ingredientRecipeId: ingredientToUpdate.parentRecipe.id,
            quantity: 1,
            quantityUnitTypeId: ingredientToUpdate.quantityUnitType.id,
        });

        const errors = await validator.validateDto(
            dto,
            ingredientToUpdate.id,
        );
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['ingredientRecipe']),
        );
    });
});
