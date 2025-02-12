import { IsArray, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class CreateRecipeCategoryDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true})
    readonly subCategoryIds: number[] = [];

    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true})
    readonly recipeIds: number[] = [];
}