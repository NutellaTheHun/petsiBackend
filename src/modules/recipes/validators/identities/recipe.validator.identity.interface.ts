import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";
import { RecipeIngredientValidatorIdentity } from "./recipe-ingredient.validator.identity.interface";

export interface RecipeValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly name?: string;
    readonly producedMenuItemId?: number;
    readonly batchResultQuantity?: number;
    readonly batchResultUnitTypeId?: number;
    readonly servingSizeQuantity?: number;
    readonly servingSizeUnitTypeId?: number;
    readonly salesPrice?: number;
    readonly isIngredient?: boolean;
    readonly categoryId?: number;
    readonly subCategoryId?: number;
    readonly ingredients?: RecipeIngredientValidatorIdentity[];
}