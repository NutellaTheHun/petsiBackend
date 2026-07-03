import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
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

const P = `t${Date.now()}`;

describe('recipe ingredient service', () => {
    let ingredientService: TestableRecipeIngredientService;
    let testingUtil: RecipeTestUtil;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;

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
        const module: TestingModule = await getRecipeTestingModule({
            recipeIngredientServiceClass: TestableRecipeIngredientService,
        });

        testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
        ingredientService = module.get(
            RecipeIngredientService,
        ) as TestableRecipeIngredientService;
        dataSource = module.get(DataSource);

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

    describe('recipe ingredient lifecycle', () => {
        let ingredient: RecipeIngredient;

        it('should create recipe ingredient with ingredientInventoryItemId', async () => {
            const dto = plainToInstance(CreateRecipeIngredientDto, {
                parentRecipeId: recipes[3].id,
                ingredientInventoryItemId: invItems[4].id,
                quantity: 1.5,
                unit: 'kg',
            });

            await dataSource.transaction(async (manager) => {
                ingredient = await ingredientService.createEntityForTest(dto, manager);
            });
            expect(ingredient.id).toBeDefined();
            expect(Number(ingredient.quantity)).toEqual(dto.quantity);
            expect(ingredient.unit).toEqual('kg');
        });

        it('should update recipe ingredient quantity', async () => {
            const newQuantity = 99;
            const loaded = await ingredientRepo.findOneOrFail({
                where: { id: ingredient.id },
                relations: ['ingredientInventoryItem', 'ingredientRecipe', 'parentRecipe'],
            });
            const dto = recipeIngredientToUpdateDto(loaded, { quantity: newQuantity });

            await dataSource.transaction(async (manager) => {
                await ingredientService.updateEntityForTest(dto, loaded, manager);
            });

            const result = await ingredientRepo.findOneOrFail({ where: { id: ingredient.id } });
            expect(Number(result.quantity)).toEqual(newQuantity);
        });

        it('should update recipe ingredient to reference a recipe instead of an inventory item', async () => {
            const loaded = await ingredientRepo.findOneOrFail({
                where: { id: ingredient.id },
                relations: ['ingredientInventoryItem', 'ingredientRecipe', 'parentRecipe'],
            });
            const dto = recipeIngredientToUpdateDto(loaded, {
                ingredientInventoryItemId: undefined,
                ingredientRecipeId: recipes[1].id,
            });

            await dataSource.transaction(async (manager) => {
                await ingredientService.updateEntityForTest(dto, loaded, manager);
            });

            const result = await ingredientRepo.findOneOrFail({
                where: { id: ingredient.id },
                relations: ['ingredientRecipe'],
            });
            expect(result.ingredientRecipe?.id).toEqual(recipes[1].id);
        });

        it('should remove recipe ingredient', async () => {
            await ingredientService.remove(ingredient.id);
            await expect(ingredientService.findOne(ingredient.id)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    it('should find seeded ingredients in findAll filtered by parentRecipe', async () => {
        const result = await ingredientService.findAll({
            filters: [`parentRecipe=${recipes[0].id}`],
            limit: 100,
        });
        const foundIds = result.items.map((i) => i.id);
        expect(foundIds).toEqual(
            expect.arrayContaining([ingredients[0].id, ingredients[1].id]),
        );
    });

    it('should find one recipe ingredient', async () => {
        const result = await ingredientService.findOne(ingredients[0].id);
        expect(result.id).toEqual(ingredients[0].id);
        expect(typeof result.unit).toEqual('string');
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(ingredientService.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(
                RecipeIngredientService.prototype as any,
                'updateEntity',
            );
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when DTO matches entity', async () => {
            const loaded = await ingredientRepo.findOneOrFail({
                where: { id: ingredients[2].id },
                relations: ['ingredientInventoryItem', 'ingredientRecipe', 'parentRecipe'],
            });
            const dto = recipeIngredientToUpdateDto(loaded);
            const result = await ingredientService.update(ingredients[2].id, dto);
            expect(result.id).toEqual(ingredients[2].id);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when quantity changes', async () => {
            const loaded = await ingredientRepo.findOneOrFail({
                where: { id: ingredients[2].id },
                relations: ['ingredientInventoryItem', 'ingredientRecipe', 'parentRecipe'],
            });
            const dto = recipeIngredientToUpdateDto(loaded, { quantity: 42 });
            await ingredientService.update(ingredients[2].id, dto);
            expect(spy).toHaveBeenCalled();
            const row = await ingredientRepo.findOneOrFail({ where: { id: ingredients[2].id } });
            expect(Number(row.quantity)).toEqual(42);
        });
    });
});
