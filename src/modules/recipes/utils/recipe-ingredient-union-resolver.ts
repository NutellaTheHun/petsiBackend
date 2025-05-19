import { CreateChildRecipeIngredientDto } from "../dto/recipe-ingredient/create-child-recipe-ingredient.dto";
import { UpdateChildRecipeIngredientDto } from "../dto/recipe-ingredient/update-child-recipe-ingedient.dto";

export function RecipeIngredientUnionResolver(obj: any) {
    if (obj?.mode === 'update') return UpdateChildRecipeIngredientDto;
    return CreateChildRecipeIngredientDto;
}