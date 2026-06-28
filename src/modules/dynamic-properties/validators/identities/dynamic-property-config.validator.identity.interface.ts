import { ValidatorIdentityBaseInterface } from '../../../../common/base/validator-identity.base.interface';
import { HolderEntityType, ValueType } from '../../entities/dynamic-property-config.entity';

export interface DynamicPropertyConfigValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly holderEntityType?: HolderEntityType;
    readonly holderCategoryId?: number | null;
    readonly propertyName?: string;
    readonly valueType?: ValueType;
    readonly valueEntityType?: string | null;
    readonly valueEntityCategoryId?: number | null;
    readonly existingHolderEntityType?: HolderEntityType;
    readonly existingHolderCategoryId?: number | null;
    readonly existingValueType?: ValueType;
    readonly existingValueEntityType?: string | null;
    readonly existingValueEntityCategoryId?: number | null;
}
