import { IsNumber, IsOptional, IsPositive } from "class-validator";

export class UpdateChildRecipeIngredientDto {
    readonly mode: 'update' = 'update';

    @IsNumber()
    @IsPositive()
    readonly id: number;

    @IsNumber()
    @IsOptional()
    readonly quantity?: number;
    
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly unitOfMeasureId?: number;
    
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
    @IsOptional()
    readonly recipeId?: number;
}