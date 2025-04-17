import { Type } from "class-transformer";
import { IsString, IsOptional, IsNumber, IsPositive, IsBoolean, IsArray, Min, ValidateNested } from "class-validator";
import { CreateRecipeCategoryDto } from "./create-recipe-category.dto";
import { RecipeIngredientUnionResolver } from "../utils/recipe-ingredient-union-resolver";
import { CreateRecipeIngredientDto } from "./create-recipe-ingredient.dto";
import { UpdateRecipeIngredientDto } from "./update-recipe-ingedient.dto";

export class UpdateRecipeDto{
    @IsString()
    @IsOptional()
    readonly name?: string;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly menuItemId?: number;

    @IsBoolean()
    @IsOptional()
    readonly isIngredient?: boolean;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly batchResultQuantity?: number;
    
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly batchResultUnitOfMeasureId?: number;
    
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly servingSizeQuantity?: number;
    
    @IsNumber()
    @IsPositive()
    @IsOptional()   
    readonly servingSizeUnitOfMeasureId?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    readonly salesPrice?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    readonly cost?: number;

    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly categoryId?: number;

    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly subCategoryId?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecipeIngredientUnionResolver)
    readonly ingredientDtos?: (CreateRecipeIngredientDto | UpdateRecipeIngredientDto)[];
}