import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";

export class CreateChildRecipeIngredientDto {
    readonly mode: 'create' = 'create';

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
}