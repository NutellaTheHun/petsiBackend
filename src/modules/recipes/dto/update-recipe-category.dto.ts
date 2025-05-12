import { IsArray, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateRecipeCategoryDto{
    @IsString()
    @IsOptional()
    readonly name?: string;

    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true})
    @IsOptional()
    readonly subCategoryIds?: number[];

    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true})
    @IsOptional()
    readonly recipeIds?: number[];
}