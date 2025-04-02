import { EntityFactory } from "../../../base/entity-factory";
import { CreateDefaultRecipeIngredientDtoValues, CreateRecipeIngredientDto } from "../dto/create-recipe-ingredient.dto";
import { UpdateRecipeIngredientDto } from "../dto/update-recipe-ingedient.dto";
import { RecipeIngredient } from "../entities/recipe-ingredient.entity";

export class RecipeIngredientFactory extends EntityFactory<RecipeIngredient, CreateRecipeIngredientDto, UpdateRecipeIngredientDto>{
    constructor(){
        super(RecipeIngredient, CreateRecipeIngredientDto, UpdateRecipeIngredientDto, CreateDefaultRecipeIngredientDtoValues())
    }

    // inventoryItem?: InventoryItem | null;
    // subRecipe?: Recipe | null;
    // quantity: number;
    // unit: UnitOfMeasure;
}