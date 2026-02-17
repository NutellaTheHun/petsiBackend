import { NestedUpdateRecipeIngredientDto } from "../../dto/recipe-ingredient/nested-update-recipe-ingedient.dto";
import { UpdateRecipeIngredientDto } from "../../dto/recipe-ingredient/update-recipe-ingedient.dto";
import { RecipeIngredient } from "../../entities/recipe-ingredient.entity";

export function recipeIngredientToUpdateDto(recipeIngredient: RecipeIngredient): UpdateRecipeIngredientDto {
    return {
        ingredientInventoryItemId: recipeIngredient.ingredientInventoryItem?.id ?? undefined,
        ingredientRecipeId: recipeIngredient.ingredientRecipe?.id ?? undefined,
        quantity: recipeIngredient.quantity,
        quantityUnitTypeId: recipeIngredient.quantityUnitType.id,
    };
}

export function recipeIngredientToNestedUpdateDto(recipeIngredient: RecipeIngredient): NestedUpdateRecipeIngredientDto {
    return {
        id: recipeIngredient.id,
        ingredientInventoryItemId: recipeIngredient.ingredientInventoryItem?.id ?? undefined,
        ingredientRecipeId: recipeIngredient.ingredientRecipe?.id ?? undefined,
        quantity: recipeIngredient.quantity,
        quantityUnitTypeId: recipeIngredient.quantityUnitType.id,
    };
}