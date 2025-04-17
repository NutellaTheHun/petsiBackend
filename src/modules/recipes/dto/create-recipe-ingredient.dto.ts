import { BaseRecipeIngredientDto } from "./base-recipe-ingredient.dto";

export class CreateRecipeIngredientDto extends BaseRecipeIngredientDto{
    readonly mode: 'create' = 'create';
}