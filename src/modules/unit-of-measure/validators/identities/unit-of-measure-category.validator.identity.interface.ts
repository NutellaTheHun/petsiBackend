import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";

export interface UnitOfMeasureCategoryValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly name?: string;
    readonly baseConversionUnitId?: number;
}