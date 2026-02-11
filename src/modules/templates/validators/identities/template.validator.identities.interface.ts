import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";
import { TemplateMenuItemValidatorIdentity } from "./template-menu-item.validator.identities.interface";

export interface TemplateValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly name?: string;
    readonly templateMenuItems?: TemplateMenuItemValidatorIdentity[];
}
