import { plainToInstance } from "class-transformer";
import { NestedUpdateRecurringOrderScheduleDto } from "../../dto/recurring-order-schedule/nested-update-recurring-order-schedule.dto";
import { RecurringOrderScheduleResponseDto } from "../../dto/recurring-order-schedule/recurring-order-schedule-response.dto";
import { UpdateRecurringOrderScheduleDto } from "../../dto/recurring-order-schedule/update-recurring-order-schedule.dto";
import { RecurringOrderSchedule } from "../../entities/recurring-order-schedule.entity";
import { parseRruleString } from "../rrule.util";

export function recurringOrderScheduleToUpdateDto(recurringOrderSchedule: RecurringOrderSchedule, merge?: Partial<UpdateRecurringOrderScheduleDto>): UpdateRecurringOrderScheduleDto {
    const { frequency, interval, daysOfWeek, dayOfMonth, monthOfYear, startDate, endDate, timezone } = parseRruleString(recurringOrderSchedule.rrule);

    return plainToInstance(UpdateRecurringOrderScheduleDto, {
        frequency,
        interval,
        daysOfWeek,
        dayOfMonth,
        monthOfYear,
        startDate,
        endDate,
        timezone,
        ...merge,
    });
}

export function recurringOrderScheduleToNestedUpdateDto(recurringOrderSchedule: RecurringOrderSchedule, merge?: Partial<NestedUpdateRecurringOrderScheduleDto>): NestedUpdateRecurringOrderScheduleDto {
    const { frequency, interval, daysOfWeek, dayOfMonth, monthOfYear, startDate, endDate, timezone } = parseRruleString(recurringOrderSchedule.rrule);

    return plainToInstance(NestedUpdateRecurringOrderScheduleDto, {
        id: recurringOrderSchedule.id,
        frequency,
        interval,
        daysOfWeek,
        dayOfMonth,
        monthOfYear,
        startDate,
        endDate,
        timezone,
        ...merge,
    });
}

export function recurringOrderScheduleToResponseDto(recurringOrderSchedule: RecurringOrderSchedule): RecurringOrderScheduleResponseDto {
    const { frequency, interval, daysOfWeek, dayOfMonth, monthOfYear, startDate, endDate, timezone } = parseRruleString(recurringOrderSchedule.rrule);

    return plainToInstance(RecurringOrderScheduleResponseDto, {
        id: recurringOrderSchedule.id,
        frequency,
        interval,
        daysOfWeek,
        dayOfMonth,
        monthOfYear,
        startDate,
        endDate,
        timezone,
    });
}


