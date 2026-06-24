import { AppUnit } from "../../../../common/units";
import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";
import { RecipeIngredientValidatorIdentity } from "./recipe-ingredient.validator.identity.interface";

export interface RecipeValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly name?: string;
    readonly producedMenuItemId?: number;
    readonly batchResultQuantity?: number;
    readonly batchResultUnit?: AppUnit | null;
    readonly servingSizeQuantity?: number;
    readonly servingSizeUnit?: AppUnit | null;
    readonly salesPrice?: number;
    readonly isIngredient?: boolean;
    readonly categoryId?: number;
    readonly subCategoryId?: number;
    readonly ingredients?: RecipeIngredientValidatorIdentity[];
}
