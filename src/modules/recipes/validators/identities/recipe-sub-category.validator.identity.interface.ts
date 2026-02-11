import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";

export interface RecipeSubCategoryValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly name?: string;
    readonly parentCategoryId?: number;
}
