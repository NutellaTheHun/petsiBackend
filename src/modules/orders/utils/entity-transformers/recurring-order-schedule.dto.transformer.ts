import { plainToInstance } from "class-transformer";
import { UpdateRecurringOrderScheduleDto } from "../../dto/recurring-order-schedule/update-recurring-order-schedule.dto";
import { RecurringOrderSchedule } from "../../entities/recurring-order-schedule.entity";

export function recurringOrderScheduleToCreateDto(recurringOrderSchedule: RecurringOrderSchedule, merge: Partial<UpdateRecurringOrderScheduleDto>): UpdateRecurringOrderScheduleDto {
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
        daysOfWeek: daysOfWeek ? daysOfWeek.split(',').map(Number) : undefined,
        dayOfMonth: dayOfMonth ? parseInt(dayOfMonth) : undefined,
        monthOfYear: monthOfYear ? parseInt(monthOfYear) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        timezone: timezone ?? undefined
    };
}
