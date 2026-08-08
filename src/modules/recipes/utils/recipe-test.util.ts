import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { AppUnit } from '../../../common/units';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItemCategory } from '../../inventory-items/entities/inventory-item-category.entity';
import { InventoryItemVendor } from '../../inventory-items/entities/inventory-item-vendor.entity';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
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
import { Tenant } from '../../tenants/entities/tenant.entity';
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

        @InjectRepository(Tenant)
        private readonly tenantRepo: Repository<Tenant>,
    ) { }

    /**
     * All 4 recipe-module entities (`Recipe`, `RecipeCategory`,
     * `RecipeSubCategory`, `RecipeIngredient`) now require a tenantId (NOT
     * NULL). Most recipe-module fixtures don't care about tenant scoping
     * themselves — they only need a valid tenantId to satisfy the column —
     * so this lazily provisions (or reuses, by fixed subdomain, across the
     * whole test run) one shared fixture Tenant rather than requiring every
     * seed method's callers to plumb a tenantId through. Tests that actually
     * exercise tenant scoping (the `*.service.spec.ts` "tenant scoping"
     * blocks) seed and pass their own explicit tenantId.
     */
    private static readonly DEFAULT_TENANT_SUBDOMAIN = 'recipe-test-util-fixture-tenant';
    private defaultTenantId?: number;
    public async getDefaultTenantId(): Promise<number> {
        if (this.defaultTenantId === undefined) {
            const existing = await this.tenantRepo.findOne({
                where: { subdomain: RecipeTestUtil.DEFAULT_TENANT_SUBDOMAIN },
            });
            const tenant =
                existing ??
                (await this.tenantRepo.save({
                    name: 'Recipe Test Util Fixture Tenant',
                    subdomain: RecipeTestUtil.DEFAULT_TENANT_SUBDOMAIN,
                }));
            this.defaultTenantId = tenant.id;
        }
        return this.defaultTenantId;
    }

    /**
     * Dependencies: InventoryItems, Recipe
     * @returns
     */
    public async getTestRecipeIngredientEntities(
        testContext: DatabaseTestContext,
    ): Promise<RecipeIngredient[]> {
        await this.inventoryItemTestUtil.initInventoryItemTestDatabase(testContext);
        await this.initRecipeTestingDatabase(testContext);

        const tenantId = await this.getDefaultTenantId();
        const ingredients = [
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
        for (const ingredient of ingredients) {
            ingredient.tenantId = tenantId;
        }
        return ingredients;
    }

    /**
     * Dependencies: None
     * @returns 4 Categories with no subcategories or recipies, catgories A,B, C and category "no category".
     */
    public async getTestRecipeCategoryEntities(
        testContext: DatabaseTestContext,
    ): Promise<RecipeCategory[]> {
        const tenantId = await this.getDefaultTenantId();
        const categories = [
            await this.categorybuilder.reset().name(CONSTANT.REC_CAT_A).build(),
            await this.categorybuilder.reset().name(CONSTANT.REC_CAT_B).build(),
            await this.categorybuilder.reset().name(CONSTANT.REC_CAT_C).build(),
        ];
        for (const category of categories) {
            category.tenantId = tenantId;
        }
        return categories;
    }

    /**
     * Dependencies: RecipeCategory
     * @returns returns 6 sub-categories(Sub cat 1-4, for categories a,b and "no sub-category" for each)
     */
    public async getTestRecipeSubCategoryEntities(
        testContext: DatabaseTestContext,
    ): Promise<RecipeSubCategory[]> {
        await this.initRecipeCategoryTestingDatabase(testContext);

        const tenantId = await this.getDefaultTenantId();
        const subCategories = [
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
        for (const subCategory of subCategories) {
            subCategory.tenantId = tenantId;
        }
        return subCategories;
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

        const tenantId = await this.getDefaultTenantId();
        const recipes = [
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
        for (const recipe of recipes) {
            recipe.tenantId = tenantId;
        }
        return recipes;
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

    // ─── Atomic-prefix seed methods ─────────────────────────────────────────────
    // These do not register cleanup — callers are responsible for deleting by ID.

    /**
     * 3 categories: A, B, C. `tenantId` defaults to a shared fixture tenant
     * (see `getDefaultTenantId`) — pass one explicitly when the test actually
     * exercises tenant scoping.
     */
    public async seedCategories(P: string = '', tenantId?: number): Promise<{ categories: RecipeCategory[] }> {
        const effectiveTenantId = tenantId ?? (await this.getDefaultTenantId());
        const names = [CONSTANT.REC_CAT_A, CONSTANT.REC_CAT_B, CONSTANT.REC_CAT_C];
        const categories: RecipeCategory[] = [];
        for (const name of names) {
            const entityName = P ? `${P}-${name}` : name;
            const entity = await this.categorybuilder.reset().name(entityName).build();
            entity.tenantId = effectiveTenantId;
            categories.push(await this.categoryRepo.save(entity));
        }
        return { categories };
    }

    /**
     * categories order: [A, B, C]. subCategories order: [sub1, sub2] under A, [sub3, sub4] under B.
     * `tenantId` defaults to a shared fixture tenant — pass one explicitly
     * when the test actually exercises tenant scoping.
     */
    public async seedSubCategories(P: string = '', tenantId?: number): Promise<{
        categories: RecipeCategory[];
        subCategories: RecipeSubCategory[];
    }> {
        const { categories } = await this.seedCategories(P, tenantId);
        const effectiveTenantId = tenantId ?? (await this.getDefaultTenantId());
        const names = [
            CONSTANT.REC_SUBCAT_1,
            CONSTANT.REC_SUBCAT_2,
            CONSTANT.REC_SUBCAT_3,
            CONSTANT.REC_SUBCAT_4,
        ];
        const parents = [categories[0], categories[0], categories[1], categories[1]];

        const subCategories: RecipeSubCategory[] = [];
        for (let i = 0; i < names.length; i++) {
            const entityName = P ? `${P}-${names[i]}` : names[i];
            const entity = await this.subCategoryBuilder
                .reset()
                .name(entityName)
                .parentCategoryById(parents[i].id)
                .build();
            entity.tenantId = effectiveTenantId;
            subCategories.push(await this.subCategoryRepo.save(entity));
        }
        return { categories, subCategories };
    }

    /**
     * Delegates to InventoryItemTestingUtil.seedItems(P) for the ingredient dependency chain.
     */
    public async seedInventoryItems(P: string = ''): Promise<{
        categories: InventoryItemCategory[];
        vendors: InventoryItemVendor[];
        items: InventoryItem[];
    }> {
        return this.inventoryItemTestUtil.seedItems(P);
    }

    /**
     * recipes order: [A, B, C, D].
     * - A: category A / sub1, not an ingredient.
     * - B: category A / sub2, isIngredient = true (usable as a sub-recipe ingredient).
     * - C: category B / sub3, not an ingredient.
     * - D: uncategorized, not an ingredient.
     *
     * `tenantId` defaults to a shared fixture tenant — pass one explicitly
     * when the test actually exercises tenant scoping.
     */
    public async seedRecipes(P: string = '', tenantId?: number): Promise<{
        categories: RecipeCategory[];
        subCategories: RecipeSubCategory[];
        recipes: Recipe[];
    }> {
        const { categories, subCategories } = await this.seedSubCategories(P, tenantId);
        const effectiveTenantId = tenantId ?? (await this.getDefaultTenantId());

        const specs: {
            name: string;
            category: RecipeCategory | null;
            subCategory: RecipeSubCategory | null;
            isIngredient: boolean;
            batchQty: number;
            batchUnit: AppUnit;
            servingQty: number;
            servingUnit: AppUnit;
            price: number;
        }[] = [
                { name: 'recipe-a', category: categories[0], subCategory: subCategories[0], isIngredient: false, batchQty: 1, batchUnit: 'lb', servingQty: 2, servingUnit: 'oz', price: 4.99 },
                { name: 'recipe-b', category: categories[0], subCategory: subCategories[1], isIngredient: true, batchQty: 3, batchUnit: 'l', servingQty: 4, servingUnit: 'ml', price: 8.99 },
                { name: 'recipe-c', category: categories[1], subCategory: subCategories[2], isIngredient: false, batchQty: 5, batchUnit: 'kg', servingQty: 6, servingUnit: 'g', price: 12.99 },
                { name: 'recipe-d', category: null, subCategory: null, isIngredient: false, batchQty: 1, batchUnit: 'lb', servingQty: 2, servingUnit: 'oz', price: 4.99 },
            ];

        const recipes: Recipe[] = [];
        for (const spec of specs) {
            const entityName = P ? `${P}-${spec.name}` : spec.name;
            let builder = this.recipeBuilder
                .reset()
                .name(entityName)
                .isIngredient(spec.isIngredient)
                .batchResultQuantity(spec.batchQty)
                .batchResultUnit(spec.batchUnit)
                .servingSizeQuantity(spec.servingQty)
                .servingSizeUnit(spec.servingUnit)
                .salesPrice(spec.price);
            if (spec.category) {
                builder = builder.categoryById(spec.category.id);
            }
            if (spec.subCategory) {
                builder = builder.subCategoryById(spec.subCategory.id);
            }
            const entity = await builder.build();
            entity.tenantId = effectiveTenantId;
            recipes.push(await this.recipeRepo.save(entity));
        }

        return { categories, subCategories, recipes };
    }

    /**
     * ingredients order: [recipeA<-invItems[0], recipeA<-recipeB, recipeC<-invItems[3]].
     * recipeB (isIngredient=true) and recipeD have no ingredients of their own.
     */
    public async seedIngredients(P: string = '', tenantId?: number): Promise<{
        categories: RecipeCategory[];
        subCategories: RecipeSubCategory[];
        recipes: Recipe[];
        invCategories: InventoryItemCategory[];
        invVendors: InventoryItemVendor[];
        invItems: InventoryItem[];
        ingredients: RecipeIngredient[];
    }> {
        const { categories, subCategories, recipes } = await this.seedRecipes(P, tenantId);
        const { categories: invCategories, vendors: invVendors, items: invItems } =
            await this.seedInventoryItems(P);
        const effectiveTenantId = tenantId ?? (await this.getDefaultTenantId());

        const [recipeA, recipeB, recipeC] = recipes;

        const ingredients: RecipeIngredient[] = [];

        const ingredient1 = await this.ingredientBuilder
            .reset()
            .parentRecipeById(recipeA.id)
            .ingredientInventoryItemById(invItems[0].id)
            .quantity(0.5)
            .unit('oz')
            .build();
        ingredient1.tenantId = effectiveTenantId;
        ingredients.push(await this.ingredientRepo.save(ingredient1));

        const ingredient2 = await this.ingredientBuilder
            .reset()
            .parentRecipeById(recipeA.id)
            .ingredientRecipeById(recipeB.id)
            .quantity(1)
            .unit('oz')
            .build();
        ingredient2.tenantId = effectiveTenantId;
        ingredients.push(await this.ingredientRepo.save(ingredient2));

        const ingredient3 = await this.ingredientBuilder
            .reset()
            .parentRecipeById(recipeC.id)
            .ingredientInventoryItemById(invItems[3].id)
            .quantity(2)
            .unit('lb')
            .build();
        ingredient3.tenantId = effectiveTenantId;
        ingredients.push(await this.ingredientRepo.save(ingredient3));

        return { categories, subCategories, recipes, invCategories, invVendors, invItems, ingredients };
    }
}
