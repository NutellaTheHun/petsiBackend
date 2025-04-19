import { CreateRecipeIngredientDto } from "../dto/create-recipe-ingredient.dto";
import { UpdateRecipeIngredientDto } from "../dto/update-recipe-ingedient.dto";

export function RecipeIngredientUnionResolver(obj: any) {
    if (obj?.mode === 'update') return UpdateRecipeIngredientDto;
    return CreateRecipeIngredientDto;
}