import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";

export interface OrderContainerItemValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly containedMenuItemId?: number;
    readonly containedItemSizeId?: number;
    readonly quantity?: number;
    readonly parentOrderMenuItemId?: number;

    readonly containedMenuItemType?: string;
}