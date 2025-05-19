import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateRecipeSubCategoryDto {
    @ApiProperty({ description: 'Name of the Recipe-Sub-Category entity.' })
    @IsString()
    @IsOptional()
    readonly name?: string;

    @ApiProperty({ description: 'Id of the Recipe-Category parent entity.' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly parentCategoryId?: number;
}