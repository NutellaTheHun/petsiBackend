import { UpdateRecipeDto } from "../../dto/recipe/update-recipe-dto";
import { Recipe } from "../../entities/recipe.entity";
import { recipeIngredientToNestedUpdateDto } from "./recipe-ingredient.dto.transformer";

export function recipeToUpdateDto(recipe: Recipe): UpdateRecipeDto {
    return {
        name: recipe.name,
        producedMenuItemId: recipe.producedMenuItem?.id ?? null,
        batchResultQuantity: recipe.batchResultQuantity ?? null,
        batchResultUnitTypeId: recipe.batchResultUnitType?.id ?? null,
        servingSizeQuantity: recipe.servingSizeQuantity ?? null,
        servingSizeUnitTypeId: recipe.servingSizeUnitType?.id ?? null,
        salesPrice: Number(recipe.salesPrice) ?? null,
        isIngredient: recipe.isIngredient,
        categoryId: recipe.category?.id ?? null,
        subCategoryId: recipe.subCategory?.id ?? null,
        ingredients: recipe.ingredients.map(ingredient => recipeIngredientToNestedUpdateDto(ingredient)),
    };
}