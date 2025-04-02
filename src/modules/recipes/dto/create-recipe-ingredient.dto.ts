import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";

export class CreateRecipeIngredientDto {

    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly recipeId: number;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly inventoryItemId?: number;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly subRecipeIngredientId?: number;

    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly quantity: number;

    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly unitOfMeasureId: number;
}

export function CreateDefaultRecipeIngredientDtoValues(){
    return [

    ];
}