import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";

export interface TenantValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly name?: string;
    readonly subdomain?: string;
}
