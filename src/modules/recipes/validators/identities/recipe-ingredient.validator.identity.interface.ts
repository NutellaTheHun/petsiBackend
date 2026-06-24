import { AppUnit } from "../../../../common/units";
import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";

export interface RecipeIngredientValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly ingredientInventoryItem?: number;
    readonly ingredientRecipe?: number;
    readonly quantity?: number;
    readonly unit?: AppUnit;
    readonly parentRecipeId?: number;
}
