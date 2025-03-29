import { Injectable, NotImplementedException } from "@nestjs/common";
import { RecipeCategoryService } from "../services/recipe-category.service";
import { RecipeIngredientService } from "../services/recipe-ingredient.service";
import { RecipeSubCategoryService } from "../services/recipe-sub-category.service";
import { RecipeService } from "../services/recipe.service";
import { RecipeIngredient } from "../entities/recipe-ingredient.entity";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";
import { Recipe } from "../entities/recipe.entity";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { MenuItemsService } from "../../menu-items/menu-items.service";
import { RecipeCategoryBuilder } from "../builders/recipe-category.builder";
import * as CONSTANT from "./constants";
import { RecipeSubCategoryBuilder } from "../builders/recipe-sub-category.builder";
import { RecipeBuilder } from "../builders/recipe.builder";
import { CUP, FL_OUNCE, GALLON, GRAM, KILOGRAM, LITER, MILLILITER, OUNCE, POUND, TABLESPOON, TEASPOON } from "../../unit-of-measure/utils/constants";
import { RecipeIngredientBuilder } from "../builders/recipe-ingredient.builder";

@Injectable()
export class RecipeTestUtil {
    constructor(
        private readonly ingredientService: RecipeIngredientService,
        private readonly ingredientBuilder: RecipeIngredientBuilder,

        private readonly categoryService: RecipeCategoryService,
        private readonly categorybuilder: RecipeCategoryBuilder,

        private readonly subCategoryService: RecipeSubCategoryService,
        private readonly subCategoryBuilder: RecipeSubCategoryBuilder,

        private readonly recipeService: RecipeService,
        private readonly recipeBuilder: RecipeBuilder,

        private readonly inventoryItemService: InventoryItemService,
        private readonly measureService: UnitOfMeasureService,
        //private readonly menuItemService: MenuItemsService,
    ){ }

    public async getTestRecipeIngredientEntities(): Promise<RecipeIngredient[]> {
        /**
         * recipe: Recipe;
         * inventoryItem?: InventoryItem | null;
         * subRecipeIngredient?: Recipe | null;
         * quantity: number;
         * unit: UnitOfMeasure;
         */
        return [
            /*await this.ingredientBuilder.reset()
                .inventoryItemByName()
                //.subRecipeByName()
                .quantity(0.5)
                .recipeByName(CONSTANT.REC_A)
                .unitOfMeasureByName(OUNCE)
                .build(),
            await this.ingredientBuilder.reset()
                .inventoryItemByName()
                //.subRecipeByName()
                .quantity(1.0)
                .recipeByName(CONSTANT.REC_A)
                .unitOfMeasureByName(POUND)
                .build(),
            await this.ingredientBuilder.reset()
                .inventoryItemByName()
                //.subRecipeByName()
                .quantity(1.5)
                .recipeByName(CONSTANT.REC_B)
                .unitOfMeasureByName(GRAM)
                .build(),
            await this.ingredientBuilder.reset()
                .inventoryItemByName()
                //.subRecipeByName()
                .quantity(2)
                .recipeByName(CONSTANT.REC_B)
                .unitOfMeasureByName(FL_OUNCE)
                .build(),
            await this.ingredientBuilder.reset()
                .inventoryItemByName()
                //.subRecipeByName()
                .quantity(2.5)
                .recipeByName(CONSTANT.REC_C)
                .unitOfMeasureByName(LITER)
                .build(),
            await this.ingredientBuilder.reset()
                .inventoryItemByName()
                //.subRecipeByName()
                .quantity(2.75)
                .recipeByName(CONSTANT.REC_C)
                .unitOfMeasureByName(GALLON)
                .build(),
            await this.ingredientBuilder.reset()
                .inventoryItemByName()
                //.subRecipeByName()
                .quantity(3)
                .recipeByName(CONSTANT.REC_D)
                .unitOfMeasureByName(KILOGRAM)
                .build(),
            await this.ingredientBuilder.reset()
                .inventoryItemByName()
                //.subRecipeByName()
                .quantity(3.5)
                .recipeByName(CONSTANT.REC_D)
                .unitOfMeasureByName(GRAM)
                .build(),
            await this.ingredientBuilder.reset()
                .inventoryItemByName()
                //.subRecipeByName()
                .quantity(10)
                .recipeByName(CONSTANT.REC_E)
                .unitOfMeasureByName(POUND)
                .build(),
            await this.ingredientBuilder.reset()
                .inventoryItemByName()
                //.subRecipeByName()
                .quantity(10.5)
                .recipeByName(CONSTANT.REC_E)
                .unitOfMeasureByName(CUP)
                .build(),
            await this.ingredientBuilder.reset()
                .inventoryItemByName()
                //.subRecipeByName()
                .quantity(10.75)
                .recipeByName(CONSTANT.REC_F)
                .unitOfMeasureByName(TABLESPOON)
                .build(),
            await this.ingredientBuilder.reset()
                .inventoryItemByName()
                //.subRecipeByName()
                .quantity(15)
                .recipeByName(CONSTANT.REC_F)
                .unitOfMeasureByName(TEASPOON)
                .build(),*/
        ]
    }

    /**
     * 
     * @returns 3 Categories with no subcategories or recipies, catgories A,B and category "no category".
     */
    public async getTestRecipeCategoryEntities(): Promise<RecipeCategory[]> {
        /**
         * name: string;
         * subCategories: RecipeSubCategory[] = [];
         * recipes: Recipe[];
         */
        return [
            await this.categorybuilder.reset()
                .name(CONSTANT.REC_CAT_A)
                .build(),
            await this.categorybuilder.reset()
                .name(CONSTANT.REC_CAT_B)
                .build(),
            await this.categorybuilder.reset()
                .name(CONSTANT.REC_CAT_NONE)
                .build(),
        ];
    }

    /**
     * 
     * @returns returns 6 sub-categories(Sub cat 1-4, for categories a,b and "no sub-category" for each)
     */
    public async getTestRecipeSubCategoryEntities(): Promise<RecipeSubCategory[]> {
        /**
         * name: string
         * parentCategory: RecipeCategory
         * recipes: Recipe[]
         */
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

    public async getTestRecipeEntities(): Promise<Recipe[]> { 
        /**
         * name: string
         * menuItem?: MenutItem | null
         * isIngredient: boolean
         * ingredients: RecipeIngredient[]
         * batchResultQuantity: number
         * batchResultUnitOfMeasure: UnitOfMeasure
         * servingSizeQuantity: number
         * servingSizeUnitOfMeasure: UnitOfMeasure
         * salesPrice: number = 0;
         * cost: number = 0;
         * category?: RecipeCategory| null;
         * subCategory?: RecipeSubCategory | null;
         */
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
                .isIngredient(true)
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
        ];
        
    }

    public async initRecipeIngredientTestingDatabase(): Promise<void> {
        throw new NotImplementedException();
    }

    public async initRecipeCategoryTestingDatabase(): Promise<void> {
        throw new NotImplementedException();
    }

    public async initRecipeSubCategoryTestingDatabase(): Promise<void> {
        throw new NotImplementedException();
    }

    public async initRecipeTestingDatabase(): Promise<void> {
        throw new NotImplementedException();
    }
}