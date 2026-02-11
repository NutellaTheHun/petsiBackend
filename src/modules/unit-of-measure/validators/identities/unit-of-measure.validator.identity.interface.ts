import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";

export interface UnitOfMeasureValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly name?: string;
    readonly abbreviation?: string;
    readonly categoryId?: number;
    readonly conversionFactorToBase?: string;
}
