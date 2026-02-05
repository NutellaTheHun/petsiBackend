import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";
import { OrderContainerItemValidatorIdentity } from "./order-container-item.validator.identity.interface";

export interface OrderMenuItemValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly menuItemId: number;
    readonly sizeId: number;
    readonly quantity: number;
    readonly containerOrderMenuItems: OrderContainerItemValidatorIdentity[];
    readonly parentOrderId: number;
}