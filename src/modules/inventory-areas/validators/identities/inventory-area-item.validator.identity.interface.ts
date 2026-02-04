import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";
import { InventoryItemSizeValidatorIdentity } from "../../../inventory-items/validators/identities/inventory-item-size.validator.identity.interface";

export interface InventoryAreaItemValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly countedInventoryItemId?: number;
    readonly amount?: number;
    readonly countedItemSizeId?: number;
    readonly countedItemSize?: InventoryItemSizeValidatorIdentity;
    readonly parentInventoryCountId?: number;
}