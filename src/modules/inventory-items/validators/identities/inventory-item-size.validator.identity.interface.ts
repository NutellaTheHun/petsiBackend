import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";

export interface InventoryItemSizeValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly inventoryItemId?: number;
    readonly packageId?: number;
    readonly measureTypeId?: number;
    readonly measureAmount?: number;
    readonly cost?: number;
}