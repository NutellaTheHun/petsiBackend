import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";

export interface RecipeIngredientValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly ingredientInventoryItemId?: number;
    readonly ingredientRecipeId?: number;
    readonly quantity?: number;
    readonly quantityUnitTypeId?: number;
    readonly parentRecipeId?: number;
}
