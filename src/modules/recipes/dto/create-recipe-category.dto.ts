import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CreateChildRecipeSubCategoryDto } from "./create-child-recipe-sub-category.dto";

export class CreateRecipeCategoryDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsOptional()
    @IsArray()
    subCategoryDtos?: CreateChildRecipeSubCategoryDto[];
}