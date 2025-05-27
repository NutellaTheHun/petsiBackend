import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateChildRecipeSubCategoryDto {
    @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating a RecipeCategory entity.' })
    @IsNotEmpty()
    readonly mode: 'update' = 'update'

    @ApiProperty({ description: 'Id of the RecipeSubCategory to be updated.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly id: number;

    @ApiProperty({ description: 'Name of the RecipeSubCategory entity.' })
    @IsString()
    @IsOptional()
    readonly subCategoryName?: string;
}