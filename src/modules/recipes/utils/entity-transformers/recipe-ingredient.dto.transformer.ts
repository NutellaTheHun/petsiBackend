import { plainToInstance } from "class-transformer";
import { NestedUpdateRecipeIngredientDto } from "../../dto/recipe-ingredient/nested-update-recipe-ingedient.dto";
import { UpdateRecipeIngredientDto } from "../../dto/recipe-ingredient/update-recipe-ingedient.dto";
import { RecipeIngredient } from "../../entities/recipe-ingredient.entity";

export function recipeIngredientToUpdateDto(recipeIngredient: RecipeIngredient, merge: Partial<UpdateRecipeIngredientDto> = {}): UpdateRecipeIngredientDto {
    return plainToInstance(UpdateRecipeIngredientDto, {
        ingredientInventoryItemId: recipeIngredient.ingredientInventoryItem?.id ?? undefined,
        ingredientRecipeId: recipeIngredient.ingredientRecipe?.id ?? undefined,
        quantity: recipeIngredient.quantity,
        unit: recipeIngredient.unit,
        ...merge,
    });
}

export function recipeIngredientToNestedUpdateDto(recipeIngredient: RecipeIngredient, merge: Partial<NestedUpdateRecipeIngredientDto> = {}): NestedUpdateRecipeIngredientDto {
    return plainToInstance(NestedUpdateRecipeIngredientDto, {
        id: recipeIngredient.id,
        ingredientInventoryItemId: recipeIngredient.ingredientInventoryItem?.id ?? undefined,
        ingredientRecipeId: recipeIngredient.ingredientRecipe?.id ?? undefined,
        quantity: recipeIngredient.quantity,
        unit: recipeIngredient.unit,
        ...merge,
    });
}
