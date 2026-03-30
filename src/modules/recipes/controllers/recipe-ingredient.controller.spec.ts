import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { Recipe } from '../entities/recipe.entity';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { RecipeIngredientController } from './recipe-ingredient.controller';

describe('recipe ingredient controller', () => {
    let testingUtil: RecipeTestUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: RecipeIngredientController;
    let ingredientRepo: Repository<RecipeIngredient>;
    let recipeRepo: Repository<Recipe>;

    beforeAll(async () => {
        module = await getRecipeTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
        await testingUtil.initRecipeIngredientTestingDatabase(dbTestContext);

        controller = module.get<RecipeIngredientController>(
            RecipeIngredientController,
        );
        ingredientRepo = module.get(getRepositoryToken(RecipeIngredient));
        recipeRepo = module.get(getRepositoryToken(Recipe));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns items aligned with repository', async () => {
        const repoRows = await ingredientRepo.find();
        const result = await controller.findAll(undefined, 100);
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with sortBy ingredient returns non-empty list', async () => {
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            'ingredient',
            'DESC',
            undefined,
            undefined,
        );
        expect(result.items.length).toBeGreaterThan(0);
    });

    it('findAll with filter by parentRecipe matches ingredient count', async () => {
        const recipe = await recipeRepo.findOneOrFail({
            where: { ingredients: MoreThan(0) },
            relations: ['ingredients'],
        });
        if (!recipe.ingredients) throw new Error('ingredients not found');
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            undefined,
            [`parentRecipe=${recipe.id}`],
        );
        expect(result.items.length).toEqual(recipe.ingredients.length);
    });

    it('findOne returns a seeded ingredient', async () => {
        const row = await ingredientRepo.findOne({ where: {} });
        if (!row) throw new Error('no seeded ingredient');
        const result = await controller.findOne(row.id);
        expect(result.id).toEqual(row.id);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('remove deletes a line then findOne fails', async () => {
        const row = await ingredientRepo.findOne({ where: {} });
        if (!row) throw new Error('no row to remove');
        const id = row.id;
        await controller.remove(id);
        await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
    });

    it('remove throws NotFoundException when id does not exist', async () => {
        await expect(controller.remove(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });
});
