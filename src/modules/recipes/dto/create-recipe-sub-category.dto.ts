import { IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class CreateRecipeSubCategoryDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly parentCategoryId: number;
}