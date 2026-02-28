import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";

export interface RecipeIngredientValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly ingredientInventoryItem?: number; // id ommited to make identity -> entity mapping easier
    readonly ingredientRecipe?: number; // id ommited to make identity -> entity mapping easier
    readonly quantity?: number;
    readonly quantityUnitTypeId?: number;
    readonly parentRecipeId?: number;
}
