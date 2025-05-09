import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";
import { BaseRecipeIngredientDto } from "./base-recipe-ingredient.dto";


export class CreateRecipeIngredientDto {
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

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly recipeId: number;

    //@Validate(InventoryItemOrSubRecipe)
    //private readonly _ingredientValidator = true;
}