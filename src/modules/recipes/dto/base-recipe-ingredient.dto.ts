import { IsNumber, IsOptional, IsPositive } from "class-validator";

export class BaseRecipeIngredientDto {
    @IsNumber()
    @IsPositive()
    readonly quantity: number;
  
    @IsNumber()
    @IsPositive()
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
    @IsOptional()
    readonly recipeId?: number;
}