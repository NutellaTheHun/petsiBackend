import { IsNumber, IsOptional, IsPositive } from "class-validator";
import { BaseRecipeIngredientDto } from "./base-recipe-ingredient.dto";

export class UpdateRecipeIngredientDto {
    readonly mode: 'update' = 'update';

    @IsNumber()
    @IsPositive()
    readonly id: number;

    @IsNumber()
    @IsOptional()
    readonly quantity: number;
    
    @IsNumber()
    @IsPositive()
    @IsOptional()
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
    readonly recipeId: number;

    //@Validate(IfInventoryItemOrSubRecipe)
    //private readonly _ingredientValidator = true;
    //validateIngredientSubRecipeIds() {}
}