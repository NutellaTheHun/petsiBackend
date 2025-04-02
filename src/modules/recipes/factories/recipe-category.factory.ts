import { EntityFactory } from "../../../base/entity-factory";
import { CreateDefaultRecipeCategoryDtoValues, CreateRecipeCategoryDto } from "../dto/create-recipe-category.dto";
import { UpdateRecipeCategoryDto } from "../dto/update-recipe-category.dto";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { REC_CAT_A, REC_CAT_B, REC_CAT_C, REC_CAT_NONE } from "../utils/constants";

export class RecipeCategoryFactory extends EntityFactory<RecipeCategory, CreateRecipeCategoryDto, UpdateRecipeCategoryDto>{
    constructor(){
        super(RecipeCategory, CreateRecipeCategoryDto, UpdateRecipeCategoryDto, CreateDefaultRecipeCategoryDtoValues());
    }

    getDefaultCategories(): RecipeCategory[]{
        return [
            this.createEntityInstance({ name: REC_CAT_NONE }),
        ];
    }

    // Returns categories with only names, subcategories, and recipes would be assigned afterwards.
    getTestingCategories(): RecipeCategory[]{
        return [
            this.createEntityInstance({ name: REC_CAT_A }),
            this.createEntityInstance({ name: REC_CAT_B }),
            this.createEntityInstance({ name: REC_CAT_C }),
            this.createEntityInstance({ name: REC_CAT_NONE }),
        ];
    }
}