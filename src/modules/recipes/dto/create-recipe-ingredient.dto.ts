import { Validate } from "class-validator";
import { BaseRecipeIngredientDto } from "./base-recipe-ingredient.dto";
import { InventoryItemOrSubRecipe } from "./validators/inventory-item-or-sub-recipe.validator";


export class CreateRecipeIngredientDto extends BaseRecipeIngredientDto{
    readonly mode: 'create' = 'create';

    @Validate(InventoryItemOrSubRecipe)
    private readonly _ingredientValidator = true;
}