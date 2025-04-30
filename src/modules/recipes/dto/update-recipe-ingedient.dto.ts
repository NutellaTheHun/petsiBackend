import { IsNumber, IsPositive, Validate } from "class-validator";
import { BaseRecipeIngredientDto } from "./base-recipe-ingredient.dto";
import { IfInventoryItemOrSubRecipe } from "./validators/if-inventory-item-or-sub-recipe.validator";

export class UpdateRecipeIngredientDto extends BaseRecipeIngredientDto{
    readonly mode: 'update' = 'update';

    @IsNumber()
    @IsPositive()
    readonly id: number;

    @Validate(IfInventoryItemOrSubRecipe)
    validateIngredientSubRecipeIds() {}
}