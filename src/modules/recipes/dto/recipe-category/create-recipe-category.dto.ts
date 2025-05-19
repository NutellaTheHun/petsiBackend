import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CreateChildRecipeSubCategoryDto } from "../recipe-sub-category/create-child-recipe-sub-category.dto";
import { ApiProperty } from "@nestjs/swagger";

export class CreateRecipeCategoryDto {
    @ApiProperty({ description: 'Name of the Recipe-Category entity.' })
    @IsString()
    @IsNotEmpty()
    readonly categoryName: string;

    @ApiProperty({ 
        description: 'Array of CreateChildRecipeSubCategoryDtos, child dtos are used when creating the parent Recipe-Category with child Recipe-Sub-Category entities.',
        type: [CreateChildRecipeSubCategoryDto]
    })
    @IsOptional()
    @IsArray()
    subCategoryDtos?: CreateChildRecipeSubCategoryDto[];
}