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
import { OUNCE, POUND } from "../../unit-of-measure/utils/constants";

@Injectable()
export class RecipeTestUtil {
    constructor(
        private readonly ingredientService: RecipeIngredientService,

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
        throw new NotImplementedException();
    }

    /**
     * 
     * @returns 4 Categories with no subcategories or recipies, catgories A-C and category "no category".
     */
    public getTestRecipeCategoryEntities(): RecipeCategory[] {
        /**
         * name: string;
         * subCategories: RecipeSubCategory[] = [];
         * recipes: Recipe[];
         */
        return [
            this.categorybuilder.reset()
                .name(CONSTANT.REC_CAT_A)
                .getCategory(),
            this.categorybuilder.reset()
                .name(CONSTANT.REC_CAT_B)
                .getCategory(),
            this.categorybuilder.reset()
                .name(CONSTANT.REC_CAT_C)
                .getCategory(),
            this.categorybuilder.reset()
                .name(CONSTANT.REC_CAT_NONE)
                .getCategory(),
        ];
    }

    public async getTestRecipeSubCategoryEntities(): Promise<RecipeSubCategory[]> {
        const catA = await this.categoryService.findOneByName(CONSTANT.REC_CAT_A);
        if(!catA){ throw new Error("category A not found"); }
        const catB = await this.categoryService.findOneByName(CONSTANT.REC_CAT_B);
        if(!catB){ throw new Error("category B not found"); }
        const catC = await this.categoryService.findOneByName(CONSTANT.REC_CAT_C);
        if(!catC){ throw new Error("categoryC not found"); }
        /**
         * name: string
         * parentCategory: RecipeCategory
         * recipes: Recipe[]
         */
        return [
            (await this.subCategoryBuilder.reset()
                .name("sub_cat_1")
                .parentCategoryById(catA.id))
                .getSubCategory(),
            (await this.subCategoryBuilder.reset()
                .name("sub_cat_2")
                .parentCategoryById(catA.id))
                .getSubCategory(),
            (await this.subCategoryBuilder.reset()
                .name("no_sub_cat")
                .parentCategoryById(catA.id))
                .getSubCategory(),

            (await this.subCategoryBuilder.reset()
                .name("sub_cat_3")
                .parentCategoryById(catB.id))
                .getSubCategory(),
            (await this.subCategoryBuilder.reset()
                .name("sub_cat_4")
                .parentCategoryById(catB.id))
                .getSubCategory(),
            (await this.subCategoryBuilder.reset()
                .name("no_sub_cat")
                .parentCategoryById(catB.id))
                .getSubCategory(),

            (await this.subCategoryBuilder.reset()
                .name("sub_cat_5")
                .parentCategoryById(catC.id))
                .getSubCategory(),
            (await this.subCategoryBuilder.reset()
                .name("sub_cat_6")
                .parentCategoryById(catC.id))
                .getSubCategory(),
            (await this.subCategoryBuilder.reset()
                .name("no_sub_cat")
                .parentCategoryById(catC.id))
                .getSubCategory(),
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
                .name("recipeA")
                .isIngredient(false)
                .batchResultQuantity(1)
                .servingSizeQuantity(2)
                .cost(2.99)
                .salesPrice(4.99)
                .servingUnitOfMeasureByName(OUNCE)
                .build()
                
                
                
        
        ];
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