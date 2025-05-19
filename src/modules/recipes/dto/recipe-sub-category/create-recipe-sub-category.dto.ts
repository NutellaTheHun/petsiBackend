import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";
import { RecipeCategory } from "../../entities/recipe-category.entity";

/**
 * Depreciated, only created as a child through {@link RecipeCategory}.
 */
export class CreateRecipeSubCategoryDto {
    @ApiProperty({ description: 'Name of the Recipe-Sub-Category entity.' })
    @IsString()
    @IsNotEmpty()
    readonly subCategoryName: string;

    @ApiProperty({ description: 'Id of the Recipe-Category parent entity.' })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly parentCategoryId: number;
}