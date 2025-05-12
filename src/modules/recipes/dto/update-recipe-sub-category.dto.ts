import { IsArray, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateRecipeSubCategoryDto {
    @IsString()
    @IsOptional()
    readonly name?: string;

    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly parentCategoryId?: number;

    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true })
    @IsOptional()
    readonly recipeIds?: number[];
}