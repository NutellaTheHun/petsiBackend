import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";
import { RecipeIngredientValidatorIdentity } from "./recipe-ingredient.validator.identity.interface";

export interface RecipeValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly name?: string;
    readonly producedMenuItemId?: number;
    readonly batchResultQuantity?: number;
    readonly batchResultUnitType?: number; // id ommited to make identity -> entity mapping easier
    readonly servingSizeQuantity?: number;
    readonly servingSizeUnitType?: number; // id ommited to make identity -> entity mapping easier
    readonly salesPrice?: number;
    readonly isIngredient?: boolean;
    readonly categoryId?: number;
    readonly subCategoryId?: number;
    readonly ingredients?: RecipeIngredientValidatorIdentity[];
}