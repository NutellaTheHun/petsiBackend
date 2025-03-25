import { EntityFactory } from "../../../base/entity-factory";
import { CreateDefaultRecipeDtoValues, CreateRecipeDto } from "../dto/create-recipe.dto";
import { UpdateRecipeDto } from "../dto/update-recipe-dto";
import { Recipe } from "../entities/recipe.entity";

export class RecipeFactory extends EntityFactory<Recipe, CreateRecipeDto, UpdateRecipeDto>{
    constructor(){
        super(Recipe, CreateRecipeDto, UpdateRecipeDto, CreateDefaultRecipeDtoValues());
    }

    // menuItem?: MenuItem | null;
    // isIngredient: boolean;
    // ingredients: RecipeIngredient[];
    // batchResultQuantity: number;
    // batchResultUnitOfMeasure: UnitOfMeasure;
    // servingSizeQuantity: number;
    // servingSizeUnitOfMeasure: UnitOfMeasure;
    // salesPrice: number = 0;
    // cost: number = 0;
    // category?: RecipeCategory;
    // subCategory?: RecipeSubCategory;
}   