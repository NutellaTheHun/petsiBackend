import { Type } from "class-transformer";
import { IsArray, IsOptional, IsString, ValidateNested } from "class-validator";
import { RecipeIngredientUnionResolver } from "../utils/recipe-ingredient-union-resolver";
import { CreateChildRecipeSubCategoryDto } from "./create-child-recipe-sub-category.dto";
import { UpdateChildRecipeSubCategoryDto } from "./update-child-recipe-sub-category.dto copy";

export class UpdateRecipeCategoryDto{
    @IsString()
    @IsOptional()
    readonly name?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecipeIngredientUnionResolver)
    readonly subCategoryDtos?: (CreateChildRecipeSubCategoryDto | UpdateChildRecipeSubCategoryDto)[];
}