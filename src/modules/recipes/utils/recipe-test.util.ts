import { Injectable, NotImplementedException } from "@nestjs/common";
import { RecipeCategoryService } from "../services/recipe-category.service";
import { RecipeIngredientService } from "../services/recipe-ingredient.service";
import { RecipeSubCategoryService } from "../services/recipe-sub-category.service";
import { RecipeService } from "../services/recipe.service";
import { RecipeIngredient } from "../entities/recipe-ingredient.entity";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";
import { Recipe } from "../entities/recipe.entity";
import { RecipeCategoryBuilder } from "../builders/recipe-category.builder";
import * as CONSTANT from "./constants";
import { RecipeSubCategoryBuilder } from "../builders/recipe-sub-category.builder";
import { RecipeBuilder } from "../builders/recipe.builder";
import { CUP, FL_OUNCE, GALLON, GRAM, KILOGRAM, LITER, MILLILITER, OUNCE, POUND, TABLESPOON, TEASPOON } from "../../unit-of-measure/utils/constants";
import { RecipeIngredientBuilder } from "../builders/recipe-ingredient.builder";
import { InventoryItemTestingUtil } from "../../inventory-items/utils/inventory-item-testing.util";
import { UnitOfMeasureTestingUtil } from "../../unit-of-measure/utils/unit-of-measure-testing.util";
import { DRY_A, DRY_C, FOOD_A, FOOD_B, OTHER_A, OTHER_B, OTHER_C } from "../../inventory-items/utils/constants";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateRecipeIngredientDto } from "../dto/create-recipe-ingredient.dto";

@Injectable()
export class RecipeTestUtil {
    constructor(
        private readonly inventoryItemTestUtil: InventoryItemTestingUtil,
        private readonly unitOfMeasureTestUtil: UnitOfMeasureTestingUtil,

        private readonly ingredientService: RecipeIngredientService,
        private readonly ingredientBuilder: RecipeIngredientBuilder,

        private readonly categoryService: RecipeCategoryService,
        private readonly categorybuilder: RecipeCategoryBuilder,

        private readonly subCategoryService: RecipeSubCategoryService,
        private readonly subCategoryBuilder: RecipeSubCategoryBuilder,

        private readonly recipeService: RecipeService,
        private readonly recipeBuilder: RecipeBuilder,

        //private readonly menuItemService: MenuItemsService,
    ){ }

    /**
     * Dependencies: InventoryItems, UnitOfMeasure, Recipe
     * @returns 
     */
    public async getTestRecipeIngredientEntities(testContext: DatabaseTestContext): Promise<RecipeIngredient[]> {
        await this.unitOfMeasureTestUtil.initUnitOfMeasureTestDatabase(testContext);
        await this.inventoryItemTestUtil.initInventoryItemTestDatabase(testContext);
        await this.initRecipeTestingDatabase(testContext);
        
        return [
            await this.ingredientBuilder.reset()
                .inventoryItemByName(FOOD_A)
                //.subRecipeByName()
                .quantity(0.5)
                .recipeByName(CONSTANT.REC_A)
                .unitOfMeasureByName(OUNCE)
                .build(),
            await this.ingredientBuilder.reset()
                .inventoryItemByName(DRY_A)
                //.subRecipeByName()
                .quantity(1.0)
                .recipeByName(CONSTANT.REC_A)
                .unitOfMeasureByName(POUND)
                .build(),
            await this.ingredientBuilder.reset()
                .inventoryItemByName(OTHER_B)
                //.subRecipeByName()
                .quantity(1.5)
                .recipeByName(CONSTANT.REC_B)
                .unitOfMeasureByName(GRAM)
                .build(),
            await this.ingredientBuilder.reset()
                .inventoryItemByName(FOOD_B)
                //.subRecipeByName()
                .quantity(2)
                .recipeByName(CONSTANT.REC_B)
                .unitOfMeasureByName(FL_OUNCE)
                .build(),
            await this.ingredientBuilder.reset()
                //.inventoryItemByName(DRY_C)
                .subRecipeByName(CONSTANT.REC_B)
                .quantity(2.5)
                .recipeByName(CONSTANT.REC_C)
                .unitOfMeasureByName(LITER)
                .build(),
            await this.ingredientBuilder.reset()
                .inventoryItemByName(OTHER_C)
                //.subRecipeByName()
                .quantity(2.75)
                .recipeByName(CONSTANT.REC_C)
                .unitOfMeasureByName(GALLON)
                .build(),
            await this.ingredientBuilder.reset()
                .inventoryItemByName(FOOD_B)
                //.subRecipeByName()
                .quantity(3)
                .recipeByName(CONSTANT.REC_D)
                .unitOfMeasureByName(KILOGRAM)
                .build(),
            await this.ingredientBuilder.reset()
                .inventoryItemByName(FOOD_A)
                //.subRecipeByName()
                .quantity(3.5)
                .recipeByName(CONSTANT.REC_D)
                .unitOfMeasureByName(GRAM)
                .build(),
            await this.ingredientBuilder.reset()
                .inventoryItemByName(OTHER_B)
                //.subRecipeByName()
                .quantity(10)
                .recipeByName(CONSTANT.REC_E)
                .unitOfMeasureByName(POUND)
                .build(),
            await this.ingredientBuilder.reset()
                .inventoryItemByName(OTHER_C)
                //.subRecipeByName()
                .quantity(10.5)
                .recipeByName(CONSTANT.REC_E)
                .unitOfMeasureByName(CUP)
                .build(),
            await this.ingredientBuilder.reset()
                .inventoryItemByName(DRY_C)
                //.subRecipeByName()
                .quantity(10.75)
                .recipeByName(CONSTANT.REC_F)
                .unitOfMeasureByName(TABLESPOON)
                .build(),
            await this.ingredientBuilder.reset()
                .inventoryItemByName(OTHER_A)
                //.subRecipeByName()
                .quantity(15)
                .recipeByName(CONSTANT.REC_F)
                .unitOfMeasureByName(TEASPOON)
                .build(),
        ];
    }

    /**
     * Dependencies: None
     * @returns 4 Categories with no subcategories or recipies, catgories A,B, C and category "no category".
     */
    public async getTestRecipeCategoryEntities(testContext: DatabaseTestContext): Promise<RecipeCategory[]> {
        return [
            await this.categorybuilder.reset()
                .name(CONSTANT.REC_CAT_A)
                .build(),
            await this.categorybuilder.reset()
                .name(CONSTANT.REC_CAT_B)
                .build(),
            await this.categorybuilder.reset()
                .name(CONSTANT.REC_CAT_C)
                .build(),
            await this.categorybuilder.reset()
                .name(CONSTANT.REC_CAT_NONE)
                .build(),
        ];
    }

    /**
     * Dependencies: RecipeCategory
     * @returns returns 6 sub-categories(Sub cat 1-4, for categories a,b and "no sub-category" for each)
     */
    public async getTestRecipeSubCategoryEntities(testContext: DatabaseTestContext): Promise<RecipeSubCategory[]> {
        await this.initRecipeCategoryTestingDatabase(testContext);

        return [
            await this.subCategoryBuilder.reset()
                .name(CONSTANT.REC_SUBCAT_1)
                .parentCategoryByName(CONSTANT.REC_CAT_A)
                .build(),
            await this.subCategoryBuilder.reset()
                .name(CONSTANT.REC_SUBCAT_2)
                .parentCategoryByName(CONSTANT.REC_CAT_A)
                .build(),
            await this.subCategoryBuilder.reset()
                .name(CONSTANT.REC_SUBCAT_NONE)
                .parentCategoryByName(CONSTANT.REC_CAT_A)
                .build(),

            await this.subCategoryBuilder.reset()
                .name(CONSTANT.REC_SUBCAT_3)
                .parentCategoryByName(CONSTANT.REC_CAT_B)
                .build(),
            await this.subCategoryBuilder.reset()
                .name(CONSTANT.REC_SUBCAT_4)
                .parentCategoryByName(CONSTANT.REC_CAT_B)
                .build(),
            await this.subCategoryBuilder.reset()
                .name(CONSTANT.REC_SUBCAT_NONE)
                .parentCategoryByName(CONSTANT.REC_CAT_B)
                .build(),
        ];
    }

    /**
     * Dependencies: UnitOfMeasure, RecipeCategory, RecipeSubCategory
     * @returns 
     */
    public async getTestRecipeEntities(testContext: DatabaseTestContext): Promise<Recipe[]> { 
        await this.unitOfMeasureTestUtil.initUnitOfMeasureTestDatabase(testContext);
        await this.initRecipeCategoryTestingDatabase(testContext);
        await this.initRecipeSubCategoryTestingDatabase(testContext);
        await this.inventoryItemTestUtil.initInventoryItemTestDatabase(testContext);
        return [
            await this.recipeBuilder.reset()
                .name(CONSTANT.REC_A)
                .isIngredient(false)
                .batchResultQuantity(1)
                .servingSizeQuantity(2)
                .cost(2.99)
                .salesPrice(4.99)
                .servingUnitOfMeasureByName(OUNCE)
                .batchResultUnitOfMeasureByName(POUND)
                .categoryByName(CONSTANT.REC_CAT_A)
                .subCategoryByName(CONSTANT.REC_SUBCAT_1)
                .build(),
            await this.recipeBuilder.reset()
                .name(CONSTANT.REC_B)
                .isIngredient(true)
                .batchResultQuantity(3)
                .servingSizeQuantity(4)
                .cost(5.99)
                .salesPrice(8.99)
                .servingUnitOfMeasureByName(MILLILITER)
                .batchResultUnitOfMeasureByName(LITER)
                .categoryByName(CONSTANT.REC_CAT_A)
                .subCategoryByName(CONSTANT.REC_SUBCAT_2)
                .build(),
            await this.recipeBuilder.reset()
                .name(CONSTANT.REC_C)
                .isIngredient(false)
                .batchResultQuantity(5)
                .servingSizeQuantity(6)
                .cost(10.99)
                .salesPrice(12.99)
                .servingUnitOfMeasureByName(GRAM)
                .batchResultUnitOfMeasureByName(KILOGRAM)
                .categoryByName(CONSTANT.REC_CAT_A)
                .subCategoryByName(CONSTANT.REC_SUBCAT_NONE)
                .build(),
            await this.recipeBuilder.reset()
                .name(CONSTANT.REC_D)
                .isIngredient(false)
                .batchResultQuantity(1)
                .servingSizeQuantity(2)
                .cost(2.99)
                .salesPrice(4.99)
                .servingUnitOfMeasureByName(OUNCE)
                .batchResultUnitOfMeasureByName(POUND)
                .categoryByName(CONSTANT.REC_CAT_B)
                .subCategoryByName(CONSTANT.REC_SUBCAT_3)
                .build(),
            await this.recipeBuilder.reset()
                .name(CONSTANT.REC_E)
                .isIngredient(false)
                .batchResultQuantity(3)
                .servingSizeQuantity(4)
                .cost(5.99)
                .salesPrice(8.99)
                .servingUnitOfMeasureByName(MILLILITER)
                .batchResultUnitOfMeasureByName(LITER)
                .categoryByName(CONSTANT.REC_CAT_B)
                .subCategoryByName(CONSTANT.REC_SUBCAT_4)
                .build(),
            await this.recipeBuilder.reset()
                .name(CONSTANT.REC_F)
                .isIngredient(true)
                .batchResultQuantity(5)
                .servingSizeQuantity(6)
                .cost(10.99)
                .salesPrice(12.99)
                .servingUnitOfMeasureByName(GRAM)
                .batchResultUnitOfMeasureByName(KILOGRAM)
                .categoryByName(CONSTANT.REC_CAT_A)
                .subCategoryByName(CONSTANT.REC_SUBCAT_NONE)
                .build(),
        ];
    }

    /**
     * Inserts 12 recipe ingredients into database, 
     * - with recipe C referencing recipe B as an ingredient
     * - Depends on InventoryItems, UnitOfMeasure, and Recipe, which are initialized beforehand.
     */
    public async initRecipeIngredientTestingDatabase(testContext: DatabaseTestContext): Promise<void>{
        testContext.addCleanupFunction(() => this.cleanupRecipeIngredientTestingDatabase());
        await this.ingredientService.insertEntities(
            await this.getTestRecipeIngredientEntities(testContext)
        );
    }

    /**
     *  -Inserts 4 categories into database, 
     * - categories A,B,C, 
     * - and No Category
     *  -No Dependencies
     */
    public async initRecipeCategoryTestingDatabase(testContext: DatabaseTestContext): Promise<void> {
        const categories = await this.getTestRecipeCategoryEntities(testContext);
        const toInsert: RecipeCategory[] = [];

        testContext.addCleanupFunction(() => this.cleanupRecipeCategoryTestingDatabase());

        for(const category of categories){
            const exists = await this.categoryService.findOneByName(category.name);
            if(!exists){ toInsert.push(category); }
        }
        await this.categoryService.insertEntities(toInsert);
    }

    /**
     * Inserts 6 sub categories into the database, 
     * - 3 each for category A and B, subCat 1-4 (CatA: subCat 1 and 2 ect.), 
     * - and no category for each cat A and B
     * - Dependent on RecipeCategory entitiy and inserts before.
     */
    public async initRecipeSubCategoryTestingDatabase(testContext: DatabaseTestContext): Promise<void> {
        const subCategories = await this.getTestRecipeSubCategoryEntities(testContext);
        const toInsert: RecipeSubCategory[] = [];
        
        testContext.addCleanupFunction(() => this.cleanupRecipeSubCategoryTestingDatabase());

        for(const subCat of subCategories){
            const exists = await this.subCategoryService.findOneByName(subCat.name);
            if(!exists){ toInsert.push(subCat); }
        }

        await this.subCategoryService.insertEntities(toInsert);
    }

    /**
     * Inserts 6 Recipes (A-F) into the database, 
     * - Recipes B is marked an Ingredient Recipe (isIngredient = true),
     * - Depends on UnitOfMeasure, RecipeCategory, and RecipeSubCategory, which are initalized beforehand
     */
    public async initRecipeTestingDatabase(testContext: DatabaseTestContext): Promise<void> {
        const recipes = await this.getTestRecipeEntities(testContext);
        const toInsert: Recipe[] = [];
        
        testContext.addCleanupFunction(() => this.cleanupRecipeTestingDatabase());

        for(const recipe of recipes){
            const exists = await this.recipeService.findOneByName(recipe.name);
            if(!exists){ toInsert.push(recipe); }
        }

        await this.recipeService.insertEntities(toInsert);
    }

    public async cleanupRecipeIngredientTestingDatabase(): Promise<void>{
        await this.ingredientService.getQueryBuilder().delete().execute();
    }

    public async cleanupRecipeCategoryTestingDatabase(): Promise<void> {
        await this.categoryService.getQueryBuilder().delete().execute();
    }

    public async cleanupRecipeSubCategoryTestingDatabase(): Promise<void> {
        await this.subCategoryService.getQueryBuilder().delete().execute();
    }

    public async cleanupRecipeTestingDatabase(): Promise<void> {
        await this.recipeService.getQueryBuilder().delete().execute();
    }

    /**
     * Returns a array CreateRecipeIngredientDto with no recipe Ids assigned, 
     * - total amount of DTOs is equal to the number of elements of quantities array,
     * - creates ingredients from inventoryItem ids array, then subRecipe ids array.
     * - will loop through inventoryItems and subRecipes if size of quantites array is larger than the combined length of items and subRecipes
     */
    public createRecipeIngredientDtos(itemIds: number[], subRecipeIds: number[], unitIds: number[], quantities: number[]): CreateRecipeIngredientDto[]{
        const results: CreateRecipeIngredientDto[] = [];

        let itemIndex = 0;
        let subRecipeIndex = 0;

        for(let i = 0; i < quantities.length; i++){
            if(itemIndex < itemIds.length){
                results.push({
                    mode: 'create',
                    inventoryItemId: itemIds[itemIndex++],
                    unitOfMeasureId: unitIds[i % unitIds.length],
                    quantity: quantities[i]
                } as CreateRecipeIngredientDto);
            }
            else if(subRecipeIndex < subRecipeIds.length){
                results.push({
                    mode: 'create',
                    subRecipeIngredientId: subRecipeIds[i - itemIds.length-1],
                    unitOfMeasureId: unitIds[i % unitIds.length],
                    quantity: quantities[i]
                } as CreateRecipeIngredientDto);
            }
            else{
                itemIndex = 0;
                subRecipeIndex = 0;

                results.push({
                    mode: 'create',
                    inventoryItemId: itemIds[itemIndex++],
                    unitOfMeasureId: unitIds[i % unitIds.length],
                    quantity: quantities[i]
                } as CreateRecipeIngredientDto);
            }
        }
        return results;
    }
}