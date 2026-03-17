import { plainToInstance } from "class-transformer";
import { RecurringOrderScheduleResponseDto } from "../../dto/recurring-order-schedule/recurring-order-schedule-response.dto";
import { UpdateRecurringOrderScheduleDto } from "../../dto/recurring-order-schedule/update-recurring-order-schedule.dto";
import { RecurringOrderSchedule } from "../../entities/recurring-order-schedule.entity";

export function recurringOrderScheduleToCreateDto(recurringOrderSchedule: RecurringOrderSchedule, merge: Partial<UpdateRecurringOrderScheduleDto>): UpdateRecurringOrderScheduleDto {
    const { frequency, interval, daysOfWeek, dayOfMonth, monthOfYear, startDate, endDate, timezone } = parseRruleString(recurringOrderSchedule.rrule);

    return plainToInstance(UpdateRecurringOrderScheduleDto, {
        orderId: recurringOrderSchedule.order.id,
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

function parseRruleString(rruleString: string): { frequency: string; interval: number | undefined; daysOfWeek: number[] | undefined; dayOfMonth: number | undefined; monthOfYear: number | undefined; startDate: Date; endDate: Date | undefined; timezone: string | undefined; } {
    const parts = rruleString.split(';');
    const partsMap = new Map<string, string>();
    for (const part of parts) {
        const [key, value] = part.split('=');
        partsMap.set(key, value);
    }

    const frequency = partsMap.get('FREQ');
    if (!frequency) {
        throw new Error('Frequency is required');
    }
    const startDate = partsMap.get('DTSTART');
    if (!startDate) {
        throw new Error('Start date is required');
    }

    const interval = partsMap.get('INTERVAL');
    const daysOfWeek = partsMap.get('BYDAY');
    const dayOfMonth = partsMap.get('BYMONTHDAY');
    const monthOfYear = partsMap.get('BYMONTH');
    const endDate = partsMap.get('UNTIL');
    const timezone = partsMap.get('TIMEZONE');

    return {
        frequency,
        startDate: new Date(startDate),
        interval: interval ? parseInt(interval) : undefined,
        daysOfWeek: daysOfWeek ? parseDaysOfWeek(daysOfWeek) : undefined,
        dayOfMonth: dayOfMonth ? parseInt(dayOfMonth) : undefined,
        monthOfYear: monthOfYear ? parseInt(monthOfYear) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        timezone: timezone ?? undefined
    };
}

function parseDaysOfWeek(daysOfWeek: string): number[] {
    const days: number[] = [];
    for (const day of daysOfWeek.split(',')) {
        switch (day) {
            case 'SU': days.push(0); break;
            case 'MO': days.push(1); break;
            case 'TU': days.push(2); break;
            case 'WE': days.push(3); break;
            case 'TH': days.push(4); break;
            case 'FR': days.push(5); break;
            case 'SA': days.push(6); break;
        }
    }
    return days;
}
