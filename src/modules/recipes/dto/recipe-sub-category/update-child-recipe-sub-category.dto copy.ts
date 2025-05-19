import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateChildRecipeSubCategoryDto {
    @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating a Recipe-Category entity.' })
    @IsNotEmpty()
    readonly mode: 'update' = 'update'

    @ApiProperty({ description: 'Id of the Recipe-Sub-Category to be updated.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly id: number;

    @ApiProperty({ description: 'Name of the Recipe-Sub-Category entity.' })
    @IsString()
    @IsOptional()
    readonly name?: string;

    @ApiProperty({ description: 'Id of the parent Recipe-Category entity.' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly parentCategoryId?: number;
}