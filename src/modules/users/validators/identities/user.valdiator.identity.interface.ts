import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";

export interface UserValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly email?: string;
    readonly password?: string;
    readonly roleIds?: number[];
    readonly name?: string;
}