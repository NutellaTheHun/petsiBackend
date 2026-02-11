import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";

export interface MenuItemContainerItemValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly containedMenuItemId?: number;
    readonly containedItemSizeId?: number;
    readonly quantity?: number;
    readonly parentMenuItemId?: number;
    readonly parentItemSizeId?: number;
}