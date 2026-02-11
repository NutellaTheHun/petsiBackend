import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";

export interface TemplateMenuItemValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly menuItemId?: number;
    readonly displayName?: string;
    readonly tablePosIndex?: number;
    readonly parentTemplateId?: number;
}
