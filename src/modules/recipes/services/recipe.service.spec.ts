import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItemCategory } from '../../inventory-items/entities/inventory-item-category.entity';
import { InventoryItemVendor } from '../../inventory-items/entities/inventory-item-vendor.entity';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { NestedCreateRecipeIngredientDto } from '../dto/recipe-ingredient/nested-create-recipe-ingredient.dto';
import { NestedUpdateRecipeIngredientDto } from '../dto/recipe-ingredient/nested-update-recipe-ingedient.dto';
import { CreateRecipeDto } from '../dto/recipe/create-recipe.dto';
import { UpdateRecipeDto } from '../dto/recipe/update-recipe-dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { Recipe } from '../entities/recipe.entity';
import { recipeToUpdateDto } from '../utils/entity-transformers/recipe.dto.transformer';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeService } from './recipe.service';

class TestableRecipeService extends RecipeService {
    async createEntityForTest(
        dto: CreateRecipeDto,
        manager: EntityManager,
    ): Promise<Recipe> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateRecipeDto,
        entity: Recipe,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('recipe service', () => {
    let recipeService: TestableRecipeService;
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
            recipeServiceClass: TestableRecipeService,
        });
        testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
        recipeService = module.get(RecipeService) as TestableRecipeService;
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

    describe('recipe lifecycle', () => {
        let recipe: Recipe;

        it('should create recipe with NestedCreateRecipeIngredientDtos', async () => {
            const dto = plainToInstance(CreateRecipeDto, {
                name: `${P}-lifecycle-recipe`,
                isIngredient: false,
                batchResultUnit: 'oz',
                servingSizeUnit: 'lb',
                ingredients: [
                    plainToInstance(NestedCreateRecipeIngredientDto, {
                        createId: 'i1',
                        ingredientInventoryItemId: invItems[0].id,
                        quantity: 1,
                        unit: 'oz',
                    }),
                ],
            });

            await dataSource.transaction(async (manager) => {
                recipe = await recipeService.createEntityForTest(dto, manager);
            });
            expect(recipe.id).toBeDefined();
            expect(recipe.name).toEqual(dto.name);
            expect(recipe.ingredients?.length).toBe(1);
        });

        it('should update recipe with NestedUpdateRecipeIngredientDto and NestedCreateRecipeIngredientDto', async () => {
            const loaded = await recipeRepo.findOneOrFail({
                where: { id: recipe.id },
                relations: ['ingredients', 'category', 'subCategory'],
            });

            const dto = recipeToUpdateDto(loaded, {
                ingredients: [
                    plainToInstance(NestedCreateRecipeIngredientDto, {
                        createId: 'c2',
                        ingredientInventoryItemId: invItems[1].id,
                        quantity: 2,
                        unit: 'oz',
                    }),
                ],
            });

            const ingredList = [...(dto.ingredients ?? [])];
            const ingredToUpdate = ingredList.pop() as NestedUpdateRecipeIngredientDto;
            const newQuantity = 101;
            ingredList.push(
                plainToInstance(NestedUpdateRecipeIngredientDto, {
                    id: ingredToUpdate.id,
                    ingredientInventoryItemId: ingredToUpdate.ingredientInventoryItemId ?? undefined,
                    ingredientRecipeId: ingredToUpdate.ingredientRecipeId ?? undefined,
                    quantity: newQuantity,
                    unit: ingredToUpdate.unit ?? 'oz',
                }),
            );
            const dtoWithIngredients = plainToInstance(UpdateRecipeDto, {
                ...dto,
                ingredients: ingredList,
            });

            await dataSource.transaction(async (manager) => {
                await recipeService.updateEntityForTest(dtoWithIngredients, recipe, manager);
            });

            const reloaded = await recipeRepo.findOneOrFail({
                where: { id: recipe.id },
                relations: ['ingredients'],
            });
            const updated = reloaded.ingredients.find((i) => i.id === ingredToUpdate.id);
            expect(Number(updated?.quantity)).toEqual(newQuantity);
        });

        it('removes recipe ingredients via authoritative parent update', async () => {
            const loaded = await recipeRepo.findOneOrFail({
                where: { id: recipe.id },
                relations: ['ingredients'],
            });

            const dto = plainToInstance(UpdateRecipeDto, {
                name: loaded.name,
                isIngredient: loaded.isIngredient,
                ingredients: [],
            });

            await dataSource.transaction(async (manager) => {
                await recipeService.updateEntityForTest(dto, loaded, manager);
            });

            const reloaded = await recipeRepo.findOneOrFail({
                where: { id: recipe.id },
                relations: ['ingredients'],
            });
            expect(reloaded.ingredients.length).toEqual(0);

            const rows = await ingredientRepo.find({
                where: { parentRecipe: { id: recipe.id } },
            });
            expect(rows.length).toEqual(0);
        });

        it('should remove recipe', async () => {
            await recipeService.remove(recipe.id);
            await expect(recipeService.findOne(recipe.id)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    it('should find seeded recipe in findAll search by recipe name', async () => {
        const result = await recipeService.findAll({
            search: recipes[0].name,
            limit: 100,
        });
        const found = result.items.find((r) => r.id === recipes[0].id);
        expect(found).toBeDefined();
        expect(
            result.items.every((r) =>
                r.name.toLowerCase().includes(recipes[0].name.toLowerCase()),
            ),
        ).toBe(true);
    });

    it('should find seeded recipe in findAll search by ingredient inventory item name', async () => {
        const result = await recipeService.findAll({
            search: invItems[0].name,
            limit: 100,
            relations: ['ingredients', 'ingredients.ingredientInventoryItem', 'ingredients.ingredientRecipe'],
        });
        const found = result.items.find((r) => r.id === recipes[0].id);
        expect(found).toBeDefined();
        expect(
            result.items.every((r) =>
                r.ingredients?.some(
                    (i) =>
                        i.ingredientInventoryItem?.name
                            ?.toLowerCase()
                            .includes(invItems[0].name.toLowerCase()) ||
                        i.ingredientRecipe?.name
                            ?.toLowerCase()
                            .includes(invItems[0].name.toLowerCase()),
                ),
            ),
        ).toBe(true);
    });

    it('should find seeded recipes in findAll filtered by category', async () => {
        const result = await recipeService.findAll({
            filters: [`category=${categories[0].id}`],
            limit: 100,
        });
        const foundIds = result.items.map((r) => r.id);
        expect(foundIds).toEqual(
            expect.arrayContaining([recipes[0].id, recipes[1].id]),
        );
    });

    it('should find seeded recipe in findAll filtered by sub category', async () => {
        const result = await recipeService.findAll({
            filters: [`subCategory=${subCategories[0].id}`],
            limit: 100,
        });
        const found = result.items.find((r) => r.id === recipes[0].id);
        expect(found).toBeDefined();
        expect(
            result.items.every((r) => r.id !== recipes[1].id),
        ).toBe(true);
    });

    it('should find one recipe with relations', async () => {
        const result = await recipeService.findOne(recipes[0].id, [
            'category',
            'subCategory',
            'ingredients',
        ]);
        expect(result.id).toEqual(recipes[0].id);
        expect(Array.isArray(result.ingredients)).toBe(true);
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(recipeService.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(RecipeService.prototype as any, 'updateEntity');
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when DTO matches current state', async () => {
            const loaded = await recipeRepo.findOneOrFail({
                where: { id: recipes[2].id },
                relations: [
                    'ingredients',
                    'ingredients.ingredientInventoryItem',
                    'ingredients.ingredientRecipe',
                    'category',
                    'subCategory',
                ],
            });
            const dto = recipeToUpdateDto(loaded);
            const result = await recipeService.update(recipes[2].id, dto);
            expect(result.id).toEqual(recipes[2].id);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const loaded = await recipeRepo.findOneOrFail({
                where: { id: recipes[2].id },
                relations: [
                    'ingredients',
                    'ingredients.ingredientInventoryItem',
                    'ingredients.ingredientRecipe',
                    'category',
                    'subCategory',
                ],
            });
            const newName = `${P}-recipe-c-renamed`;
            const dto = recipeToUpdateDto(loaded, { name: newName });
            const result = await recipeService.update(recipes[2].id, dto);
            expect(result.name).toEqual(newName);
            expect(spy).toHaveBeenCalled();
        });
    });
});
