import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";

export interface OrderContainerItemValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly containedMenuItemId: number;
    readonly containedItemSizeId: number;
    readonly parentOrderMenuItemId: number;

    readonly quantity: number;
    readonly variableMaxAmount: number | null;

    readonly containedItemType: string;
    readonly parentMenuItemType: string;
    readonly parentMenuItemId: number;
    readonly parentMenuItemSizeId: number;
}