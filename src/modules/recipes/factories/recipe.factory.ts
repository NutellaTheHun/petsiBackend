import { EntityFactory } from "../../../base/entity-factory";
import { CreateDefaultRecipeDtoValues, CreateRecipeDto } from "../dto/create-recipe.dto";
import { UpdateRecipeDto } from "../dto/update-recipe-dto";
import { Recipe } from "../entities/recipe.entity";

export class RecipeFactory extends EntityFactory<Recipe, CreateRecipeDto, UpdateRecipeDto>{
    constructor(){
        super(Recipe, CreateRecipeDto, UpdateRecipeDto, CreateDefaultRecipeDtoValues());
    }
}