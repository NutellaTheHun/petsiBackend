import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";

export interface LocationValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly tenantId?: number;
    readonly name?: string;
    readonly address?: string;
    readonly phoneNumber?: string;
    readonly email?: string;
}
