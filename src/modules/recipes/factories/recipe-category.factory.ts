import { EntityFactory } from "../../../base/entity-factory";
import { CreateDefaultRecipeCategoryDtoValues, CreateRecipeCategoryDto } from "../dto/create-recipe-category.dto";
import { UpdateRecipeCategoryDto } from "../dto/update-recipe-category.dto";
import { RecipeCategory } from "../entities/recipe-category.entity";

export class RecipeCategoryFactory extends EntityFactory<RecipeCategory, CreateRecipeCategoryDto, UpdateRecipeCategoryDto>{
    constructor(){
        super(RecipeCategory, CreateRecipeCategoryDto, UpdateRecipeCategoryDto, CreateDefaultRecipeCategoryDtoValues());
    }
}