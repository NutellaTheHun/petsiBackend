import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";

export interface LabelTypeValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly name?: string;
    readonly length?: number;
    readonly width?: number;
}