import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";

export interface RoleValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly name?: string;
}