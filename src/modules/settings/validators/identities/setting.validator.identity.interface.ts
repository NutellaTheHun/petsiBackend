import { ValidatorIdentityBaseInterface } from '../../../../common/base/validator-identity.base.interface';
import { SettingValue } from '../../utils/setting-value.util';

export interface SettingValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly name?: string;
    readonly locationId?: number | null;
    readonly value?: SettingValue;
}
