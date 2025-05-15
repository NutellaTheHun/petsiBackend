import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class CreateRecipeSubCategoryDto {
    @ApiProperty({ description: 'Name of the Recipe-Sub-Category entity.' })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({ description: 'Id of the Recipe-Category parent entity.' })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly parentCategoryId: number;
}