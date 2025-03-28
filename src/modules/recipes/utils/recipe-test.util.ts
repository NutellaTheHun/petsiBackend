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

@Injectable()
export class RecipeTestUtil {
    constructor(
        private readonly ingredientService: RecipeIngredientService,
        private readonly categoryService: RecipeCategoryService,
        private readonly subCategoryService: RecipeSubCategoryService,
        private readonly recipeService: RecipeService,

        private readonly inventoryItemService: InventoryItemService,
        private readonly measureService: UnitOfMeasureService,
        //private readonly menuItemService: MenuItemsService,
    ){ }

    public async getTestRecipeIngredientEntites(): Promise<RecipeIngredient[]> {
        /**
         * recipe: Recipe;
         * inventoryItem?: InventoryItem | null;
         * subRecipeIngredient?: Recipe | null;
         * quantity: number;
         * unit: UnitOfMeasure;
         */
        throw new NotImplementedException();
    }

    public async getTestRecipeCategoryEntities(): Promise<RecipeCategory[]> {
        /**
         * name: string;
         * subCategories: RecipeSubCategory[] = [];
         * recipes: Recipe[];
         */
        throw new NotImplementedException();
    }

    public async getTestRecipeSubCategoryEntites(): Promise<RecipeSubCategory[]> {
        /**
         * name: string
         * parentCategory: RecipeCategory
         * recipes: Recipe[]
         */
        throw new NotImplementedException();
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
        throw new NotImplementedException();
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