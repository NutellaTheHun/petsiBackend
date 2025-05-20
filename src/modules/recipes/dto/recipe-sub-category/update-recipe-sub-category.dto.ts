import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateRecipeSubCategoryDto {
    @ApiProperty({ description: 'Name of the Recipe-Sub-Category entity.' })
    @IsString()
    @IsOptional()
    readonly subCategoryName?: string;
}