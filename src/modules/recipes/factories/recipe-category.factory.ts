import { EntityFactory } from "../../../base/entity-factory";
import { CreateDefaultRecipeCategoryDtoValues, CreateRecipeCategoryDto } from "../dto/create-recipe-category.dto";
import { UpdateRecipeCategoryDto } from "../dto/update-recipe-category.dto";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { RECIPE_CAT_A, RECIPE_CAT_B, RECIPE_CAT_C, RECIPE_CAT_NONE } from "../utils/constants";

export class RecipeCategoryFactory extends EntityFactory<RecipeCategory, CreateRecipeCategoryDto, UpdateRecipeCategoryDto>{
    constructor(){
        super(RecipeCategory, CreateRecipeCategoryDto, UpdateRecipeCategoryDto, CreateDefaultRecipeCategoryDtoValues());
    }

    getDefaultCategories(): RecipeCategory[]{
        return [
            this.createEntityInstance({ name: RECIPE_CAT_NONE }),
        ];
    }

    // Returns categories with only names, subcategories, and recipes would be assigned afterwards.
    getTestingCategories(): RecipeCategory[]{
        return [
            this.createEntityInstance({ name: RECIPE_CAT_A }),
            this.createEntityInstance({ name: RECIPE_CAT_B }),
            this.createEntityInstance({ name: RECIPE_CAT_C }),
            this.createEntityInstance({ name: RECIPE_CAT_NONE }),
        ];
    }
}