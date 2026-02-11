import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";

export interface OrderCategoryValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly name?: string;
}