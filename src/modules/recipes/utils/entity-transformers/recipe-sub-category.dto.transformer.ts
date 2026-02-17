import { NestedUpdateRecipeSubCategoryDto } from "../../dto/recipe-sub-category/nested-update-recipe-sub-category.dto";
import { UpdateRecipeSubCategoryDto } from "../../dto/recipe-sub-category/update-recipe-sub-category.dto";
import { RecipeSubCategory } from "../../entities/recipe-sub-category.entity";

export function recipeSubCategoryToUpdateDto(recipeSubCategory: RecipeSubCategory): UpdateRecipeSubCategoryDto {
    return {
        name: recipeSubCategory.name,
    };
}

export function recipeSubCategoryToNestedUpdateDto(recipeSubCategory: RecipeSubCategory): NestedUpdateRecipeSubCategoryDto {
    return {
        id: recipeSubCategory.id,
        name: recipeSubCategory.name,
    };
}