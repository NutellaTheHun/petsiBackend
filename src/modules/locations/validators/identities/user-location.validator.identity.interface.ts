import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";

export interface UserLocationValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly userId?: number;
    readonly locationId?: number;
    readonly roleIds?: number[];
}
