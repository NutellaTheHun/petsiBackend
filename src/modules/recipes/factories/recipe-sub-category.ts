import { EntityFactory } from "../../../base/entity-factory";
import { CreateDefaultRecipeSubCategoryDtoValues, CreateRecipeSubCategoryDto } from "../dto/create-recipe-sub-category.dto";
import { UpdateRecipeSubCategoryDto } from "../dto/update-recipe-sub-category.dto";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";
import { RECIPE_SUB_CAT_BLUE, RECIPE_SUB_CAT_GREEN, RECIPE_SUB_CAT_NONE, RECIPE_SUB_CAT_ORANGE, RECIPE_SUB_CAT_RED, RECIPE_SUB_CAT_YELLOW } from "../utils/constants";

export class RecipeSubCategoryFactory extends EntityFactory<RecipeSubCategory, CreateRecipeSubCategoryDto, UpdateRecipeSubCategoryDto>{
    constructor(){
        super(RecipeSubCategory, CreateRecipeSubCategoryDto, UpdateRecipeSubCategoryDto, CreateDefaultRecipeSubCategoryDtoValues());
    }

    /**
     * Sub categories with only names, must be assigned parent categories before being inserted.
     */
    getTestingSubCategories(): RecipeSubCategory[]{
            return [
                this.createEntityInstance({ name: RECIPE_SUB_CAT_BLUE }),
                this.createEntityInstance({ name: RECIPE_SUB_CAT_ORANGE }),
                this.createEntityInstance({ name: RECIPE_SUB_CAT_GREEN }),
                this.createEntityInstance({ name: RECIPE_SUB_CAT_RED }),
                this.createEntityInstance({ name: RECIPE_SUB_CAT_YELLOW }),
                this.createEntityInstance({ name: RECIPE_SUB_CAT_NONE}),
            ];
    }
}