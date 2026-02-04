import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";
import { InventoryItemSizeValidatorIdentity } from "./inventory-item-size.validator.identity.interface";

export interface InventoryItemValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly name?: string;
    readonly categoryId?: number;
    readonly vendorId?: number;
    readonly sizes?: InventoryItemSizeValidatorIdentity[];
}
