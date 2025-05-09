import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from "class-validator";
import { CreateRecipeIngredientDto } from "./create-recipe-ingredient.dto";

export class CreateRecipeDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly menuItemId?: number;

    @IsBoolean()
    @IsOptional()
    readonly isIngredient: boolean;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly batchResultQuantity: number;
    
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()  
    readonly batchResultUnitOfMeasureId: number;
    
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()   
    readonly servingSizeQuantity: number;
    
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()    
    readonly servingSizeUnitOfMeasureId: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    readonly salesPrice: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    readonly cost: number;

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
    ingredientDtos?: CreateRecipeIngredientDto[];
}