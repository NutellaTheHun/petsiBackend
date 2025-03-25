import { EntityFactory } from "../../../base/entity-factory";
import { CreateDefaultRecipeSubCategoryDtoValues, CreateRecipeSubCategoryDto } from "../dto/create-recipe-sub-category.dto";
import { UpdateRecipeSubCategoryDto } from "../dto/update-recipe-sub-category.dto";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";

export class RecipeSubCategoryFactory extends EntityFactory<RecipeSubCategory, CreateRecipeSubCategoryDto, UpdateRecipeSubCategoryDto>{
    constructor(){
        super(RecipeSubCategory, CreateRecipeSubCategoryDto, UpdateRecipeSubCategoryDto, CreateDefaultRecipeSubCategoryDtoValues());
    }
}