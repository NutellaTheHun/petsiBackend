import { plainToInstance } from "class-transformer";
import { UpdateRecipeCategoryDto } from "../../dto/recipe-category/update-recipe-category.dto";
import { RecipeCategory } from "../../entities/recipe-category.entity";
import { recipeSubCategoryToNestedUpdateDto } from "./recipe-sub-category.dto.transformer";

export function recipeCategoryToUpdateDto(recipeCategory: RecipeCategory, merge: Partial<UpdateRecipeCategoryDto> = {}): UpdateRecipeCategoryDto {
    const existingSubCategories = recipeCategory.subCategories.map(subCategory => recipeSubCategoryToNestedUpdateDto(subCategory)) ?? [];
    const mergedSubCategories = merge.subCategories ? [...existingSubCategories, ...merge.subCategories] : existingSubCategories;

    return plainToInstance(UpdateRecipeCategoryDto, {
        name: recipeCategory.name,
        ...merge,
        subCategories: mergedSubCategories,
    });
}