import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";

export class CreateRecipeIngredientDto {
    @IsNumber()
    @IsNotEmpty()
    readonly quantity: number;
    
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly unitOfMeasureId: number;
    
    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly inventoryItemId?: number;
    
    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly subRecipeIngredientId?: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly recipeId: number;
}