import { plainToInstance } from "class-transformer";
import { UpdateRecipeCategoryDto } from "../../dto/recipe-category/update-recipe-category.dto";
import { RecipeCategory } from "../../entities/recipe-category.entity";
import { recipeSubCategoryToNestedUpdateDto } from "./recipe-sub-category.dto.transformer";

export function recipeCategoryToUpdateDto(recipeCategory: RecipeCategory): UpdateRecipeCategoryDto {
    return plainToInstance(UpdateRecipeCategoryDto, {
        name: recipeCategory.name,
        subCategories: recipeCategory.subCategories.map(subCategory => recipeSubCategoryToNestedUpdateDto(subCategory)),
    });
}