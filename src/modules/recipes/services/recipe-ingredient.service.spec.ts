import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { AppHttpException } from '../../../util/exceptions/app-http-exception';
import { InventoryItemService } from '../../inventory-items/services/inventory-item.service';
import { DRY_A, FOOD_A, FOOD_B, OTHER_A } from '../../inventory-items/utils/constants';
import { UnitOfMeasureService } from '../../unit-of-measure/services/unit-of-measure.service';
import { FL_OUNCE, GALLON } from '../../unit-of-measure/utils/constants';
import { CreateChildRecipeIngredientDto } from '../dto/recipe-ingredient/create-child-recipe-ingredient.dto';
import { CreateRecipeIngredientDto } from '../dto/recipe-ingredient/create-recipe-ingredient.dto';
import { UpdateChildRecipeIngredientDto } from '../dto/recipe-ingredient/update-child-recipe-ingedient.dto';
import { UpdateRecipeIngredientDto } from '../dto/recipe-ingredient/update-recipe-ingedient.dto';
import { UpdateRecipeDto } from '../dto/recipe/update-recipe-dto';
import { REC_A, REC_B, REC_C, REC_E } from '../utils/constants';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeIngredientService } from './recipe-ingredient.service';
import { RecipeService } from './recipe.service';

describe('recipe ingredient service', () => {
    let ingredientService: RecipeIngredientService;
    let testingUtil: RecipeTestUtil;
    let dbTestContext: DatabaseTestContext;

    let recipeService: RecipeService;
    let inventoryItemService: InventoryItemService;
    let unitOfMeasureService: UnitOfMeasureService;

    let testIngredId: number;
    let testSubRecId: number;
    let testIds: number[];
    let testRecipeId: number;


    beforeAll(async () => {
        const module: TestingModule = await getRecipeTestingModule();

        testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
        dbTestContext = new DatabaseTestContext();
        await testingUtil.initRecipeIngredientTestingDatabase(dbTestContext);

        ingredientService = module.get<RecipeIngredientService>(RecipeIngredientService);
        recipeService = module.get<RecipeService>(RecipeService);
        inventoryItemService = module.get<InventoryItemService>(InventoryItemService);
        unitOfMeasureService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(ingredientService).toBeDefined();
    });

    it('should fail to create recipe ingredient (badRequest), the create properly for future test', async () => {
        const recipeA = await recipeService.findOneByName(REC_A, ['ingredients']);
        if (!recipeA) { throw new Error("recipe not found"); }
        if (!recipeA.ingredients) { throw new Error("recipe not found"); }

        const item = await inventoryItemService.findOneByName(OTHER_A);
        if (!item) { throw new Error("inventory item not found"); }

        const unit = await unitOfMeasureService.findOneByName(FL_OUNCE);
        if (!unit) { throw new Error("unit of measure not found"); }

        const dto = {
            mode: 'create',
            parentRecipeId: recipeA.id,
            ingredientInventoryItemId: item.id,
            quantity: 1,
            quantityMeasurementId: unit.id,
        } as CreateRecipeIngredientDto;

        await expect(ingredientService.create(dto)).rejects.toThrow(BadRequestException);

        const createIngredDto = {
            mode: 'create',
            ingredientInventoryItemId: item.id,
            quantity: 1,
            quantityMeasurementId: unit.id,
        } as CreateChildRecipeIngredientDto;

        const theRest = recipeA.ingredients.map(ingred => ({
            mode: 'update',
            id: ingred.id,
        }) as UpdateChildRecipeIngredientDto);

        const updateRecipeDto = {
            ingredientDtos: [createIngredDto, ...theRest]
        } as UpdateRecipeDto;

        const updateResult = await recipeService.update(recipeA.id, updateRecipeDto);
        if (!updateResult) { throw new Error(); }
        if (!updateResult.ingredients) { throw new Error(); }

        const result = updateResult.ingredients[0];

        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull();
        expect(result?.parentRecipe?.id).toEqual(recipeA.id);
        expect(result?.ingredientInventoryItem?.id).toEqual(item.id);
        expect(result?.quantity).toEqual(1);
        expect(result?.quantityMeasure.id).toEqual(unit.id);

        testIngredId = result?.id as number;
        testRecipeId = recipeA.id;
    });

    it('should be referenced in recipe query', async () => {
        const testRecipe = await recipeService.findOne(testRecipeId, ['ingredients']);
        if (!testRecipe) { throw new NotFoundException(); }

        expect(testRecipe.ingredients?.findIndex(ingred => ingred.id === testIngredId)).not.toEqual(-1);
    });

    it('should create recipe ingredient (subRecipeIngredient)', async () => {
        const recipeA = await recipeService.findOneByName(REC_A, ['ingredients']);
        if (!recipeA) { throw new Error("recipe not found"); }
        if (!recipeA.ingredients) { throw new Error("recipe not found"); }

        const subRec = await recipeService.findOneByName(REC_C);
        if (!subRec) { throw new Error("inventory item not found"); }

        const unit = await unitOfMeasureService.findOneByName(FL_OUNCE);
        if (!unit) { throw new Error("unit of measure not found"); }

        const dto = {
            mode: 'create',
            parentRecipeId: recipeA.id,
            ingredientRecipeId: subRec.id,
            quantity: 1,
            quantityMeasurementId: unit.id,
        } as CreateRecipeIngredientDto;

        const createIngredDto = {
            mode: 'create',
            ingredientRecipeId: subRec.id,
            quantity: 1,
            quantityMeasurementId: unit.id,
        } as CreateChildRecipeIngredientDto;

        const theRest = recipeA.ingredients.map(ingred => ({
            mode: 'update',
            id: ingred.id,
        }) as UpdateChildRecipeIngredientDto);

        const updateRecipeDto = {
            ingredientDtos: [createIngredDto, ...theRest]
        } as UpdateRecipeDto;


        const updateResult = await recipeService.update(recipeA.id, updateRecipeDto);
        if (!updateResult) { throw new Error(); }
        if (!updateResult.ingredients) { throw new Error(); }

        const result = updateResult.ingredients[0];

        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull();
        expect(result?.parentRecipe?.id).toEqual(recipeA.id);
        expect(result?.ingredientRecipe?.id).toEqual(subRec.id);
        expect(result?.quantity).toEqual(1);
        expect(result?.quantityMeasure.id).toEqual(unit.id);

        testSubRecId = result?.id as number;
    });

    it('should FAIL create recipe ingredient (inventoryItem and sub recipe)', async () => {
        const recipeA = await recipeService.findOneByName(REC_A);
        if (!recipeA) { throw new Error("recipe not found"); }

        const item = await inventoryItemService.findOneByName(FOOD_B);
        if (!item) { throw new Error("inventory item not found"); }

        const subRec = await recipeService.findOneByName(REC_E);
        if (!subRec) { throw new Error("inventory item not found"); }

        const unit = await unitOfMeasureService.findOneByName(FL_OUNCE);
        if (!unit) { throw new Error("unit of measure not found"); }

        const dto = plainToInstance(CreateRecipeIngredientDto, {
            mode: 'create',
            recipeId: recipeA.id,
            inventoryItemId: item.id,
            subRecipeIngredientId: subRec.id,
            quantity: 1,
            unitOfMeasureId: unit.id,
        });

        const recIngredDto = {
            mode: 'create',
            ingredientInventoryItemId: item.id,
            ingredientRecipeId: subRec.id,
            quantity: 1,
            quantityMeasurementId: unit.id,
        } as CreateChildRecipeIngredientDto;

        const updateRecipeDto = {
            ingredientDtos: [recIngredDto]
        } as UpdateRecipeDto

        await expect(recipeService.update(recipeA.id, updateRecipeDto)).rejects.toThrow(AppHttpException);
    });

    it('should find ingredient by id', async () => {
        const result = await ingredientService.findOne(testIngredId);
        expect(result).not.toBeNull();
    });

    it('should update inventoryItem', async () => {
        const newItem = await inventoryItemService.findOneByName(DRY_A);
        if (!newItem) { throw new Error("inventory item not found"); }

        const dto = {
            mode: 'update',
            ingredientInventoryItemId: newItem.id,
            ingredientRecipeId: null,
        } as UpdateRecipeIngredientDto;

        const result = await ingredientService.update(testSubRecId, dto);

        expect(result).not.toBeNull();
        expect(result?.ingredientInventoryItem?.id).toEqual(newItem.id);
    });

    it('should lose subRecipeIngredient reference', async () => {
        const result = await ingredientService.findOne(testSubRecId, ['ingredientInventoryItem', 'ingredientRecipe']);
        expect(result).not.toBeNull();

        expect(result?.ingredientInventoryItem).not.toBeNull();
        expect(result?.ingredientRecipe).toBeNull();
    });

    it('should update subRecipeIngredient', async () => {
        const newRec = await recipeService.findOneByName(REC_C);
        if (!newRec) { throw new Error("inventory item not found"); }

        const dto = {
            mode: 'update',
            ingredientRecipeId: newRec.id,
            ingredientInventoryItemId: null,
        } as UpdateRecipeIngredientDto;

        const result = await ingredientService.update(testIngredId, dto);

        expect(result).not.toBeNull();
        expect(result?.ingredientRecipe?.id).toEqual(newRec.id);
    });

    it('should lose ingredient reference', async () => {
        const result = await ingredientService.findOne(testIngredId, ['ingredientInventoryItem', 'ingredientRecipe']);
        expect(result).not.toBeNull();

        expect(result?.ingredientInventoryItem).toBeNull();
        expect(result?.ingredientRecipe).not.toBeNull();
    });

    it('should update quantity', async () => {
        const dto = {
            mode: 'update',
            quantity: 10,
        } as UpdateRecipeIngredientDto;

        const result = await ingredientService.update(testIngredId, dto);

        expect(result).not.toBeNull();
        expect(result?.quantity).toEqual(10);
    });

    it('should update unit of measure', async () => {
        const newUnit = await unitOfMeasureService.findOneByName(GALLON);
        if (!newUnit) { throw new Error("unit of measure not found"); }

        const dto = {
            mode: 'update',
            quantityMeasurementId: newUnit.id,
        } as UpdateRecipeIngredientDto;

        const result = await ingredientService.update(testIngredId, dto);

        expect(result).not.toBeNull();
        expect(result?.quantityMeasure.id).toEqual(newUnit.id);
    });

    it('should FAIL update inventoryItemID and subRecipe', async () => {
        const newRec = await recipeService.findOneByName(REC_E);
        if (!newRec) { throw new Error("inventory item not found"); }

        const newItem = await inventoryItemService.findOneByName(FOOD_B);
        if (!newItem) { throw new Error("inventory item not found"); }

        const dto = plainToInstance(UpdateRecipeIngredientDto, {
            mode: 'update',
            subRecipeIngredientId: newRec.id,
            inventoryItemId: newItem.id
        });

        const updateRecIngredDto = {
            mode: 'update',
            ingredientRecipeId: newRec.id,
            ingredientInventoryItemId: newItem.id,
        } as UpdateChildRecipeIngredientDto;

        const updateRecipeDto = {
            ingredientDtos: [updateRecIngredDto],
        } as UpdateRecipeDto

        await expect(recipeService.update(newRec.id, updateRecipeDto)).rejects.toThrow(AppHttpException);
    });

    it('should get all ingredients', async () => {
        const expected = await testingUtil.getTestRecipeIngredientEntities(dbTestContext);

        const results = await ingredientService.findAll({ limit: 15 });
        expect(results.items.length).toEqual(expected.length + 2);
        testIds = [results.items[0].id, results.items[1].id, results.items[2].id];
    });

    it('should get ingredients by list of ids', async () => {
        const results = await ingredientService.findEntitiesById(testIds);
        expect(results.length).toEqual(testIds.length);
        for (const result of results) {
            expect(testIds.findIndex(id => id === result.id)).not.toEqual(-1);
        }
    });

    it('should get a list of ingredients by recipe name', async () => {
        const expected = await recipeService.findOneByName(REC_A, ["ingredients"]);
        if (!expected) { throw new Error("recipe A not found"); }
        if (!expected.ingredients) { throw new Error("recipe A ingredients are null"); }

        const results = await ingredientService.findByRecipeName(REC_A);
        expect(results.length).toEqual(expected.ingredients.length);
    });

    it('should get a list of ingredients by inventoryItemName?', async () => {
        const results = await ingredientService.findByInventoryItemName(FOOD_A);
        expect(results.length).toEqual(2);
    });

    it('should remove recipe ingredient', async () => {
        const removal = await ingredientService.remove(testSubRecId);
        expect(removal).toBeTruthy();

        await expect(ingredientService.findOne(testSubRecId)).rejects.toThrow(NotFoundException);
    });

    it('should not be referenced in recipe query', async () => {
        const testRecipe = await recipeService.findOne(testRecipeId, ['ingredients']);
        if (!testRecipe) { throw new NotFoundException(); }

        expect(testRecipe.ingredients?.findIndex(ingred => ingred.id === testSubRecId)).toEqual(-1);
    });

    it('should delete ingredient when deleting recipe', async () => {
        const expected = await recipeService.findOneByName(REC_B, ["ingredients"]);
        if (!expected) { throw new Error("recipe B not found"); }
        if (!expected.ingredients) { throw new Error("recipe B ingredients are null"); }

        const ids = (await ingredientService.findByRecipeName(REC_B)).map(ingred => ingred.id);

        await recipeService.remove(expected.id);

        const verify = await ingredientService.findEntitiesById(ids);
        expect(verify.length).toEqual(0);
    });

    it('should delete ingredient when deleting inventory item', async () => {
        const item = await inventoryItemService.findOneByName(FOOD_A);
        if (!item) { throw new NotFoundException(); }

        const ids = (await ingredientService.findByInventoryItemName(FOOD_A)).map(ingred => ingred.id);

        await inventoryItemService.remove(item.id);

        const verify = await ingredientService.findEntitiesById(ids);
        expect(verify.length).toEqual(0);
    });

    it('should delete ingredient when deleting subRecipe', async () => {
        const ingredient = await ingredientService.findOne(testIngredId, ['ingredientRecipe']);
        if (!ingredient) { throw new NotFoundException(); }
        if (!ingredient.ingredientRecipe) { throw new Error(); }

        await recipeService.remove(ingredient.ingredientRecipe?.id);

        await expect(ingredientService.findOne(testIngredId)).rejects.toThrow(NotFoundException);
    });
});