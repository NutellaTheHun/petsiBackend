import { ValidatorIdentityBaseInterface } from '../../../../common/base/validator-identity.base.interface';
import { HolderEntityType, ValueType } from '../../entities/dynamic-property-config.entity';

export interface DynamicPropertyConfigValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly holderEntityType?: HolderEntityType;
    readonly propertyName?: string;
    readonly valueType?: ValueType;
    readonly valueEntityType?: string | null;
}
