import { IsNumber, IsPositive } from "class-validator";
import { BaseRecipeIngredientDto } from "./base-recipe-ingredient.dto";

export class UpdateRecipeIngredientDto extends BaseRecipeIngredientDto{
    readonly mode: 'update' = 'update';

    @IsNumber()
    @IsPositive()
    readonly id: number;
}