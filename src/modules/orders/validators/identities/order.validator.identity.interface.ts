import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";
import { OrderMenuItemValidatorIdentity } from "./order-menu-item.validator.identity.interface";

export interface OrderValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly recipient: string;
    readonly fulfillmentDate: Date;
    readonly fulfillmentType: string;
    readonly fulfillmentContactName?: string;
    readonly deliveryAddress?: string;
    readonly phoneNumber?: string;
    readonly email?: string;
    readonly note?: string;
    readonly isFrozen?: boolean;
    readonly isWeekly?: boolean;
    readonly weeklyFulfillment?: string;
    readonly categoryId?: number;
    readonly orderedItems?: OrderMenuItemValidatorIdentity[];
}