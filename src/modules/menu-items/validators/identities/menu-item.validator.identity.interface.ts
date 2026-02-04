import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";
import { MenuItemContainerItemValidatorIdentity } from "./menu-item-container-item.validator.identity.interface";

export interface MenuItemValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly name?: string;
    readonly type?: string;
    readonly categoryId?: number;
    readonly sizeIds?: number[];
    readonly containerMenuItems?: MenuItemContainerItemValidatorIdentity[];
    readonly variableMaxAmount?: number;
}