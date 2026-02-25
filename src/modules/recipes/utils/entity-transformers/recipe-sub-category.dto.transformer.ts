import { plainToInstance } from "class-transformer";
import { NestedUpdateRecipeSubCategoryDto } from "../../dto/recipe-sub-category/nested-update-recipe-sub-category.dto";
import { UpdateRecipeSubCategoryDto } from "../../dto/recipe-sub-category/update-recipe-sub-category.dto";
import { RecipeSubCategory } from "../../entities/recipe-sub-category.entity";

export function recipeSubCategoryToUpdateDto(recipeSubCategory: RecipeSubCategory, merge: Partial<UpdateRecipeSubCategoryDto> = {}): UpdateRecipeSubCategoryDto {
    return plainToInstance(UpdateRecipeSubCategoryDto, {
        name: recipeSubCategory.name,
        ...merge,
    });
}

export function recipeSubCategoryToNestedUpdateDto(recipeSubCategory: RecipeSubCategory, merge: Partial<NestedUpdateRecipeSubCategoryDto> = {}): NestedUpdateRecipeSubCategoryDto {
    return plainToInstance(NestedUpdateRecipeSubCategoryDto, {
        id: recipeSubCategory.id,
        name: recipeSubCategory.name,
        ...merge,
    });
}