import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";

export interface RecurringOrderScheduleValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly orderId: number;
    readonly frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    readonly interval?: number;
    readonly daysOfWeek?: number[];
    readonly dayOfMonth?: number;
    readonly monthOfYear?: number;
    readonly startDate?: Date;
    readonly endDate?: Date;
    readonly timezone?: string;
}