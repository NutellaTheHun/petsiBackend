import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { AppUnit } from '../../../common/units';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import {
    DRY_A,
    DRY_C,
    FOOD_A,
    FOOD_B,
    OTHER_A,
    OTHER_B,
    OTHER_C,
} from '../../inventory-items/utils/constants';
import { InventoryItemTestingUtil } from '../../inventory-items/utils/inventory-item-testing.util';
import { RecipeCategoryBuilder } from '../builders/recipe-category.builder';
import { RecipeIngredientBuilder } from '../builders/recipe-ingredient.builder';
import { RecipeSubCategoryBuilder } from '../builders/recipe-sub-category.builder';
import { RecipeBuilder } from '../builders/recipe.builder';
import { NestedCreateRecipeIngredientDto } from '../dto/recipe-ingredient/nested-create-recipe-ingredient.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { Recipe } from '../entities/recipe.entity';
import * as CONSTANT from './constants';

@Injectable()
export class RecipeTestUtil {
    private initCategory = false;
    private initSubCategory = false;
    private initRecipe = false;
    private initIngredient = false;

    constructor(
        private readonly inventoryItemTestUtil: InventoryItemTestingUtil,

        @InjectRepository(RecipeIngredient)
        private readonly ingredientRepo: Repository<RecipeIngredient>,
        private readonly ingredientBuilder: RecipeIngredientBuilder,

        @InjectRepository(RecipeCategory)
        private readonly categoryRepo: Repository<RecipeCategory>,
        private readonly categorybuilder: RecipeCategoryBuilder,

        @InjectRepository(RecipeSubCategory)
        private readonly subCategoryRepo: Repository<RecipeSubCategory>,
        private readonly subCategoryBuilder: RecipeSubCategoryBuilder,

        @InjectRepository(Recipe)
        private readonly recipeRepo: Repository<Recipe>,
        private readonly recipeBuilder: RecipeBuilder,
    ) { }

    /**
     * Dependencies: InventoryItems, Recipe
     * @returns
     */
    public async getTestRecipeIngredientEntities(
        testContext: DatabaseTestContext,
    ): Promise<RecipeIngredient[]> {
        await this.inventoryItemTestUtil.initInventoryItemTestDatabase(testContext);
        await this.initRecipeTestingDatabase(testContext);

        return [
            await this.ingredientBuilder
                .reset()
                .ingredientInventoryItemByName(FOOD_A)
                .quantity(0.5)
                .parentRecipeByName(CONSTANT.REC_A)
                .unit('oz')
                .build(),
            await this.ingredientBuilder
                .reset()
                .ingredientInventoryItemByName(DRY_A)
                .quantity(1.0)
                .parentRecipeByName(CONSTANT.REC_A)
                .unit('lb')
                .build(),
            await this.ingredientBuilder
                .reset()
                .ingredientInventoryItemByName(OTHER_B)
                .quantity(1.5)
                .parentRecipeByName(CONSTANT.REC_B)
                .unit('g')
                .build(),
            await this.ingredientBuilder
                .reset()
                .ingredientInventoryItemByName(FOOD_B)
                .quantity(2)
                .parentRecipeByName(CONSTANT.REC_B)
                .unit('fl-oz')
                .build(),
            await this.ingredientBuilder
                .reset()
                .ingredientRecipeByName(CONSTANT.REC_B)
                .quantity(2.5)
                .parentRecipeByName(CONSTANT.REC_C)
                .unit('l')
                .build(),
            await this.ingredientBuilder
                .reset()
                .ingredientInventoryItemByName(OTHER_C)
                .quantity(2.75)
                .parentRecipeByName(CONSTANT.REC_C)
                .unit('gal')
                .build(),
            await this.ingredientBuilder
                .reset()
                .ingredientInventoryItemByName(FOOD_B)
                .quantity(3)
                .parentRecipeByName(CONSTANT.REC_D)
                .unit('kg')
                .build(),
            await this.ingredientBuilder
                .reset()
                .ingredientInventoryItemByName(FOOD_A)
                .quantity(3.5)
                .parentRecipeByName(CONSTANT.REC_D)
                .unit('g')
                .build(),
            await this.ingredientBuilder
                .reset()
                .ingredientInventoryItemByName(OTHER_B)
                .quantity(10)
                .parentRecipeByName(CONSTANT.REC_E)
                .unit('lb')
                .build(),
            await this.ingredientBuilder
                .reset()
                .ingredientInventoryItemByName(OTHER_C)
                .quantity(10.5)
                .parentRecipeByName(CONSTANT.REC_E)
                .unit('cup')
                .build(),
            await this.ingredientBuilder
                .reset()
                .ingredientInventoryItemByName(DRY_C)
                .quantity(10.75)
                .parentRecipeByName(CONSTANT.REC_F)
                .unit('Tbs')
                .build(),
            await this.ingredientBuilder
                .reset()
                .ingredientInventoryItemByName(OTHER_A)
                .quantity(15)
                .parentRecipeByName(CONSTANT.REC_F)
                .unit('tsp')
                .build(),
        ];
    }

    /**
     * Dependencies: None
     * @returns 4 Categories with no subcategories or recipies, catgories A,B, C and category "no category".
     */
    public async getTestRecipeCategoryEntities(
        testContext: DatabaseTestContext,
    ): Promise<RecipeCategory[]> {
        return [
            await this.categorybuilder.reset().name(CONSTANT.REC_CAT_A).build(),
            await this.categorybuilder.reset().name(CONSTANT.REC_CAT_B).build(),
            await this.categorybuilder.reset().name(CONSTANT.REC_CAT_C).build(),
        ];
    }

    /**
     * Dependencies: RecipeCategory
     * @returns returns 6 sub-categories(Sub cat 1-4, for categories a,b and "no sub-category" for each)
     */
    public async getTestRecipeSubCategoryEntities(
        testContext: DatabaseTestContext,
    ): Promise<RecipeSubCategory[]> {
        await this.initRecipeCategoryTestingDatabase(testContext);

        return [
            await this.subCategoryBuilder
                .reset()
                .name(CONSTANT.REC_SUBCAT_1)
                .parentCategoryByName(CONSTANT.REC_CAT_A)
                .build(),
            await this.subCategoryBuilder
                .reset()
                .name(CONSTANT.REC_SUBCAT_2)
                .parentCategoryByName(CONSTANT.REC_CAT_A)
                .build(),

            await this.subCategoryBuilder
                .reset()
                .name(CONSTANT.REC_SUBCAT_3)
                .parentCategoryByName(CONSTANT.REC_CAT_B)
                .build(),
            await this.subCategoryBuilder
                .reset()
                .name(CONSTANT.REC_SUBCAT_4)
                .parentCategoryByName(CONSTANT.REC_CAT_B)
                .build(),
        ];
    }

    /**
     * Dependencies: RecipeCategory, RecipeSubCategory
     * @returns
     */
    public async getTestRecipeEntities(
        testContext: DatabaseTestContext,
    ): Promise<Recipe[]> {
        await this.initRecipeCategoryTestingDatabase(testContext);
        await this.initRecipeSubCategoryTestingDatabase(testContext);
        await this.inventoryItemTestUtil.initInventoryItemTestDatabase(testContext);

        return [
            await this.recipeBuilder
                .reset()
                .name(CONSTANT.REC_A)
                .isIngredient(false)
                .batchResultQuantity(1)
                .servingSizeQuantity(2)
                .salesPrice(4.99)
                .servingSizeUnit('oz')
                .batchResultUnit('lb')
                .categoryByName(CONSTANT.REC_CAT_A)
                .subCategoryByName(CONSTANT.REC_SUBCAT_1)
                .build(),
            await this.recipeBuilder
                .reset()
                .name(CONSTANT.REC_B)
                .isIngredient(true)
                .batchResultQuantity(3)
                .servingSizeQuantity(4)
                .salesPrice(8.99)
                .servingSizeUnit('ml')
                .batchResultUnit('l')
                .categoryByName(CONSTANT.REC_CAT_A)
                .subCategoryByName(CONSTANT.REC_SUBCAT_2)
                .build(),
            await this.recipeBuilder
                .reset()
                .name(CONSTANT.REC_C)
                .isIngredient(false)
                .batchResultQuantity(5)
                .servingSizeQuantity(6)
                .salesPrice(12.99)
                .servingSizeUnit('g')
                .batchResultUnit('kg')
                .categoryByName(CONSTANT.REC_CAT_A)
                .build(),
            await this.recipeBuilder
                .reset()
                .name(CONSTANT.REC_D)
                .isIngredient(false)
                .batchResultQuantity(1)
                .servingSizeQuantity(2)
                .salesPrice(4.99)
                .servingSizeUnit('oz')
                .batchResultUnit('lb')
                .categoryByName(CONSTANT.REC_CAT_B)
                .subCategoryByName(CONSTANT.REC_SUBCAT_3)
                .build(),
            await this.recipeBuilder
                .reset()
                .name(CONSTANT.REC_E)
                .isIngredient(false)
                .batchResultQuantity(3)
                .servingSizeQuantity(4)
                .salesPrice(8.99)
                .servingSizeUnit('ml')
                .batchResultUnit('l')
                .categoryByName(CONSTANT.REC_CAT_B)
                .subCategoryByName(CONSTANT.REC_SUBCAT_4)
                .build(),
            await this.recipeBuilder
                .reset()
                .name(CONSTANT.REC_F)
                .isIngredient(true)
                .batchResultQuantity(5)
                .servingSizeQuantity(6)
                .salesPrice(12.99)
                .servingSizeUnit('g')
                .batchResultUnit('kg')
                .build(),
        ];
    }

    /**
     * Inserts 12 recipe ingredients into database,
     * - with recipe C referencing recipe B as an ingredient
     * - Depends on InventoryItems and Recipe, which are initialized beforehand.
     */
    public async initRecipeIngredientTestingDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.initIngredient) {
            return;
        }
        this.initIngredient = true;

        testContext.addCleanupFunction(() =>
            this.cleanupRecipeIngredientTestingDatabase(),
        );

        const ingredients = await this.getTestRecipeIngredientEntities(testContext);
        for (const ingredient of ingredients) {
            const exists = await this.ingredientRepo.findOne({
                where: {
                    ingredientInventoryItem: ingredient.ingredientInventoryItem ? { id: ingredient.ingredientInventoryItem.id } : undefined,
                    ingredientRecipe: ingredient.ingredientRecipe ? { id: ingredient.ingredientRecipe.id } : undefined,
                    parentRecipe: { id: ingredient.parentRecipe.id }
                },
            });
            if (!exists) {
                await this.ingredientRepo.save(ingredient);
            }
        }
    }

    /**
     *  -Inserts 4 categories into database,
     * - categories A,B,C,
     * - and No Category
     *  -No Dependencies
     */
    public async initRecipeCategoryTestingDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.initCategory) {
            return;
        }
        this.initCategory = true;

        const categories = await this.getTestRecipeCategoryEntities(testContext);
        const toInsert: RecipeCategory[] = [];

        testContext.addCleanupFunction(() =>
            this.cleanupRecipeCategoryTestingDatabase(),
        );

        for (const category of categories) {
            const exists = await this.categoryRepo.findOne({
                where: { name: category.name },
            });
            if (!exists) {
                toInsert.push(category);
            }
        }
        await this.categoryRepo.insert(toInsert);
    }

    /**
     * Inserts 6 sub categories into the database,
     * - 3 each for category A and B, subCat 1-4 (CatA: subCat 1 and 2 ect.),
     * - and no category for each cat A and B
     * - Dependent on RecipeCategory entitiy and inserts before.
     */
    public async initRecipeSubCategoryTestingDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.initSubCategory) {
            return;
        }
        this.initSubCategory = true;

        const subCategories =
            await this.getTestRecipeSubCategoryEntities(testContext);
        const toInsert: RecipeSubCategory[] = [];

        testContext.addCleanupFunction(() =>
            this.cleanupRecipeSubCategoryTestingDatabase(),
        );

        for (const subCat of subCategories) {
            const exists = await this.subCategoryRepo.findOne({
                where: { name: subCat.name },
            });
            if (!exists) {
                toInsert.push(subCat);
            }
        }

        await this.subCategoryRepo.insert(toInsert);
    }

    /**
     * Inserts 6 Recipes (A-F) into the database,
     * - Recipes B is marked an Ingredient Recipe (isIngredient = true),
     * - Depends on RecipeCategory and RecipeSubCategory, which are initialized beforehand
     */
    public async initRecipeTestingDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.initRecipe) {
            return;
        }
        this.initRecipe = true;

        const recipes = await this.getTestRecipeEntities(testContext);
        const toInsert: Recipe[] = [];

        testContext.addCleanupFunction(() => this.cleanupRecipeTestingDatabase());

        for (const recipe of recipes) {
            const exists = await this.recipeRepo.findOne({
                where: { name: recipe.name },
            });
            if (!exists) {
                toInsert.push(recipe);
            }
        }

        await this.recipeRepo.insert(toInsert);
    }

    public async cleanupRecipeIngredientTestingDatabase(): Promise<void> {
        await this.ingredientRepo.deleteAll();
    }

    public async cleanupRecipeCategoryTestingDatabase(): Promise<void> {
        await this.categoryRepo.deleteAll();
    }

    public async cleanupRecipeSubCategoryTestingDatabase(): Promise<void> {
        await this.subCategoryRepo.deleteAll();
    }

    public async cleanupRecipeTestingDatabase(): Promise<void> {
        await this.recipeRepo.deleteAll();
    }

    /**
     * Returns a array CreateRecipeIngredientDto with no recipe Ids assigned,
     * - total amount of DTOs is equal to the number of elements of quantities array,
     * - creates ingredients from inventoryItem ids array, then subRecipe ids array.
     * - will loop through inventoryItems and subRecipes if size of quantites array is larger than the combined length of items and subRecipes
     */
    public createNestedRecipeIngredientDtos(
        itemIds: number[],
        subRecipeIds: number[],
        units: AppUnit[],
        quantities: number[],
    ): NestedCreateRecipeIngredientDto[] {
        const results: NestedCreateRecipeIngredientDto[] = [];

        let itemIndex = 0;
        let subRecipeIndex = 0;
        let createId = 1;

        for (let i = 0; i < quantities.length; i++) {
            if (itemIndex < itemIds.length) {
                results.push(
                    plainToInstance(NestedCreateRecipeIngredientDto, {
                        createId: `c${createId++}`,
                        ingredientInventoryItemId: itemIds[itemIndex++],
                        unit: units[i % units.length],
                        quantity: quantities[i],
                    }),
                );
            } else if (subRecipeIndex < subRecipeIds.length) {
                results.push(
                    plainToInstance(NestedCreateRecipeIngredientDto, {
                        createId: `c${createId++}`,
                        ingredientRecipeId: subRecipeIds[i - itemIds.length - 1],
                        unit: units[i % units.length],
                        quantity: quantities[i],
                    }),
                );
            } else {
                itemIndex = 0;
                subRecipeIndex = 0;

                results.push(
                    plainToInstance(NestedCreateRecipeIngredientDto, {
                        createId: `c${createId++}`,
                        ingredientInventoryItemId: itemIds[itemIndex++],
                        unit: units[i % units.length],
                        quantity: quantities[i],
                    }),
                );
            }
        }
        return results;
    }
}
