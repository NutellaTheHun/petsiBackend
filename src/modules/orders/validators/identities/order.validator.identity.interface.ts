import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";
import { OrderMenuItemValidatorIdentity } from "./order-menu-item.validator.identity.interface";
import { RecurringOrderScheduleValidatorIdentity } from "./recurring-order-schedule.identity.interface";

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
    readonly categoryId?: number;
    readonly orderedItems?: OrderMenuItemValidatorIdentity[];
    readonly recurrenceSchedule?: RecurringOrderScheduleValidatorIdentity | null;
    readonly occurrenceType?: string | null;
    readonly occurrenceState?: string | null;
    readonly recurrenceDate?: Date | null;
    readonly templateOrderId?: number | null;
}