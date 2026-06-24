import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, MoreThan, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { CreateRecipeIngredientDto } from '../dto/recipe-ingredient/create-recipe-ingredient.dto';
import { UpdateRecipeIngredientDto } from '../dto/recipe-ingredient/update-recipe-ingedient.dto';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { Recipe } from '../entities/recipe.entity';
import { recipeIngredientToUpdateDto } from '../utils/entity-transformers/recipe-ingredient.dto.transformer';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeIngredientService } from './recipe-ingredient.service';

class TestableRecipeIngredientService extends RecipeIngredientService {
    async createEntityForTest(
        dto: CreateRecipeIngredientDto,
        manager: EntityManager,
    ): Promise<RecipeIngredient> {
        return this.createEntity(dto, manager);
    }

    async updateEntityForTest(
        dto: UpdateRecipeIngredientDto,
        entity: RecipeIngredient,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

describe('recipe ingredient service', () => {
    let ingredientService: TestableRecipeIngredientService;
    let testingUtil: RecipeTestUtil;
    let dbTestContext: DatabaseTestContext;
    let dataSource: DataSource;
    let ingredientRepo: Repository<RecipeIngredient>;
    let recipeRepo: Repository<Recipe>;
    let inventoryItemRepo: Repository<InventoryItem>;

    beforeAll(async () => {
        const module: TestingModule = await getRecipeTestingModule({
            recipeIngredientServiceClass: TestableRecipeIngredientService,
        });

        testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
        dbTestContext = new DatabaseTestContext();
        await testingUtil.initRecipeIngredientTestingDatabase(dbTestContext);

        ingredientService = module.get(RecipeIngredientService) as TestableRecipeIngredientService;
        ingredientRepo = module.get(getRepositoryToken(RecipeIngredient));
        recipeRepo = module.get(getRepositoryToken(Recipe));
        inventoryItemRepo = module.get(getRepositoryToken(InventoryItem));

        dataSource = module.get(DataSource);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(ingredientService).toBeDefined();
    });

    // test createEntity() with ingredientInventoryItemId
    it('should create recipe ingredient with ingredientInventoryItemId', async () => {
        const [parent] = await recipeRepo.find({ take: 1 });
        const [inv] = await inventoryItemRepo.find({ take: 1 });
        if (!parent || !inv) throw new Error('fixtures not found');
        const dto = plainToInstance(CreateRecipeIngredientDto, {
            parentRecipeId: parent.id,
            ingredientInventoryItemId: inv.id,
            quantity: 1.5,
            unit: 'kg',
        });

        await dataSource.transaction(async (manager) => {
            const result = await ingredientService.createEntityForTest(dto, manager);
            expect(result).not.toBeNull();
            expect(result?.id).toBeDefined();
            expect(result.quantity).toEqual(dto.quantity);
            expect(result.unit).toEqual('kg');
        });
    });

    // test createEntity() with ingredientRecipeId
    it('should create recipe ingredient with ingredientRecipeId', async () => {
        const recipes = await recipeRepo.find({ take: 2 });
        if (recipes.length < 2) throw new Error('fixtures not found');
        const dto = plainToInstance(CreateRecipeIngredientDto, {
            parentRecipeId: recipes[0].id,
            ingredientRecipeId: recipes[1].id,
            quantity: 2,
            unit: 'cup',
        });

        await dataSource.transaction(async (manager) => {
            const result = await ingredientService.createEntityForTest(dto, manager);
            expect(result).not.toBeNull();
            expect(result?.id).toBeDefined();
            expect(result.quantity).toEqual(dto.quantity);
            expect(result.unit).toEqual('cup');
        });
    });

    // test updateEntity()
    it('should update recipe ingredient', async () => {
        const newQuantity = 99;
        const [existing] = await ingredientRepo.find({ take: 1, relations: ['ingredientInventoryItem', 'ingredientRecipe', 'parentRecipe'] });
        if (!existing) throw new Error('ingredient not found');

        const dto = recipeIngredientToUpdateDto(existing, { quantity: newQuantity });

        await dataSource.transaction(async (manager) => {
            await ingredientService.updateEntityForTest(dto, existing, manager);
        });

        const result = await ingredientRepo.findOne({ where: { id: existing.id } });
        if (!result) throw new Error('result not found');
        expect(Number(result.quantity)).toEqual(newQuantity);
    });

    // test updateEntity() with ingredientInventoryItemId
    it('should update recipe ingredient with ingredientInventoryItemId', async () => {
        const [toUpdate] = await ingredientRepo.find({
            take: 1,
            relations: ['ingredientRecipe', 'ingredientInventoryItem', 'parentRecipe'],
        });
        const [inv] = await inventoryItemRepo.find({ take: 1 });
        if (!toUpdate || !inv) throw new Error('fixtures not found');

        const dto = recipeIngredientToUpdateDto(toUpdate, { ingredientInventoryItemId: inv.id });

        await dataSource.transaction(async (manager) => {
            await ingredientService.updateEntityForTest(dto, toUpdate, manager);
        });

        const result = await ingredientRepo.findOne({
            where: { id: toUpdate.id },
            relations: ['ingredientInventoryItem'],
        });
        if (!result) throw new Error('result not found');
        expect(result.ingredientInventoryItem?.id).toEqual(inv.id);
    });

    // test updateEntity() with ingredientRecipeId
    it('should update recipe ingredient with ingredientRecipeId', async () => {
        const [toUpdate] = await ingredientRepo.find({
            take: 1,
            relations: ['ingredientInventoryItem', 'ingredientRecipe', 'parentRecipe'],
        });
        const [recipe] = await recipeRepo.find({ take: 1 });
        if (!toUpdate || !recipe) throw new Error('fixtures not found');
        const dto = recipeIngredientToUpdateDto(toUpdate, { ingredientRecipeId: recipe.id });

        await dataSource.transaction(async (manager) => {
            await ingredientService.updateEntityForTest(dto, toUpdate, manager);
        });

        const result = await ingredientRepo.findOne({
            where: { id: toUpdate.id },
            relations: ['ingredientRecipe'],
        });
        if (!result) throw new Error('result not found');
        expect(result.ingredientRecipe?.id).toEqual(recipe.id);
    });

    // test updateEntity() changing unit
    it('should update recipe ingredient unit', async () => {
        const [existing] = await ingredientRepo.find({ take: 1, relations: ['ingredientInventoryItem', 'ingredientRecipe', 'parentRecipe'] });
        if (!existing) throw new Error('ingredient not found');

        const dto = recipeIngredientToUpdateDto(existing, { unit: 'lb' });

        await dataSource.transaction(async (manager) => {
            await ingredientService.updateEntityForTest(dto, existing, manager);
        });

        const result = await ingredientRepo.findOne({ where: { id: existing.id } });
        if (!result) throw new Error('result not found');
        expect(result.unit).toEqual('lb');
    });

    // test findAll()
    it('should find all recipe ingredients', async () => {
        const repoResult = await ingredientRepo.find();
        const serviceResult = await ingredientService.findAll({ limit: 100 });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findAll() with sortBy ingredient
    it('should find all recipe ingredients with sortBy ingredient name', async () => {
        const serviceResult = await ingredientService.findAll({
            sortBy: 'ingredient',
            sortOrder: 'DESC',
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toBeGreaterThan(0);
    });

    // test findOne()
    it('should find one recipe ingredient', async () => {
        const [ing] = await ingredientRepo.find({ take: 1 });
        if (!ing) throw new Error('ingredient not found');

        const serviceResult = await ingredientService.findOne(ing.id);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(ing.id);
        expect(typeof serviceResult?.unit).toEqual('string');
    });

    // test remove()
    it('should remove recipe ingredient', async () => {
        const [ing] = await ingredientRepo.find({ take: 1 });
        if (!ing) throw new Error('ingredient not found');
        const id = ing.id;

        const deleteResult = await ingredientService.remove(id);
        expect(deleteResult).toBe(true);
        await expect(ingredientService.findOne(id)).rejects.toThrow(NotFoundException);
    });

    // test findAll() with filter by recipe
    it('should find all recipe ingredients with filter by recipe', async () => {
        const recipe = await recipeRepo.findOneOrFail({ where: { ingredients: MoreThan(0) }, relations: ['ingredients'] });
        if (!recipe.ingredients) throw new Error('ingredients not found');
        const serviceResult = await ingredientService.findAll({
            filters: [`parentRecipe=${recipe.id}`],
            limit: 100,
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(recipe.ingredients.length);
    });

});
