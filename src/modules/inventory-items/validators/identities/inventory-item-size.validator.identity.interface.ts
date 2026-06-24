import { AppUnit } from "../../../../common/units";
import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";

export interface InventoryItemSizeValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly inventoryItemId?: number;
    readonly packageId?: number;
    readonly unit?: AppUnit;
    readonly measureAmount?: number;
    readonly cost?: number;
}
