import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";

export interface LabelValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly imageUrl?: string;
    readonly labelTypeId?: number;
    readonly menuItemId?: number;
}