import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";
import { InventoryAreaItemValidatorIdentity } from "./inventory-area-item.validator.identity.interface";

export interface InventoryAreaCountValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly inventoryAreaId?: number;
    readonly countedInventoryItems?: InventoryAreaItemValidatorIdentity[];
}