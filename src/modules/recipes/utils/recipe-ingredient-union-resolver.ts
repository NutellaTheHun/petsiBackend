import { CreateChildRecipeIngredientDto } from "../dto/create-child-recipe-ingredient.dto";
import { UpdateChildRecipeIngredientDto } from "../dto/update-child-recipe-ingedient.dto";

export function RecipeIngredientUnionResolver(obj: any) {
    if (obj?.mode === 'update') return UpdateChildRecipeIngredientDto;
    return CreateChildRecipeIngredientDto;
}