import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CreateChildRecipeSubCategoryDto } from "../recipe-sub-category/create-child-recipe-sub-category.dto";

export class CreateRecipeCategoryDto {
    @ApiProperty({ description: 'Name of the RecipeCategory entity.' })
    @IsString()
    @IsNotEmpty()
    readonly categoryName: string;

    @ApiProperty({
        description: 'Array of CreateChildRecipeSubCategoryDtos, child dtos are used when creating the parent RecipeCategory with child RecipeSubCategory entities.',
        type: [CreateChildRecipeSubCategoryDto]
    })
    @IsOptional()
    @IsArray()
    subCategoryDtos?: CreateChildRecipeSubCategoryDto[];
}