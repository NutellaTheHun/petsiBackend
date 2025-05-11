import { CreateRecipeIngredientDto } from "../dto/create-recipe-ingredient.dto";
import { UpdateChildRecipeIngredientDto } from "../dto/update-child-recipe-ingedient.dto copy";

export function RecipeIngredientUnionResolver(obj: any) {
    if (obj?.mode === 'update') return UpdateChildRecipeIngredientDto;
    return CreateRecipeIngredientDto;
}