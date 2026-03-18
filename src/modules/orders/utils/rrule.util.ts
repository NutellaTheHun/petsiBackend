import { CreateRecurringOrderScheduleDto } from "../dto/recurring-order-schedule/create-recurring-order-schedule.dto";
import { UpdateRecurringOrderScheduleDto } from "../dto/recurring-order-schedule/update-recurring-order-schedule.dto";

export function parseRruleString(rruleString: string): { frequency: string; interval: number | undefined; daysOfWeek: number[] | undefined; dayOfMonth: number | undefined; monthOfYear: number | undefined; startDate: Date; endDate: Date | undefined; timezone: string | undefined; } {
    //const parts = rruleString.split(':')[1].split(';');
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
    const startDate = partsMap.get('DTSTART')
    const interval = partsMap.get('INTERVAL');
    const daysOfWeek = partsMap.get('BYDAY');
    const dayOfMonth = partsMap.get('BYMONTHDAY');
    const monthOfYear = partsMap.get('BYMONTH');
    const endDate = partsMap.get('UNTIL');
    const timezone = partsMap.get('TIMEZONE');

    return {
        frequency,
        startDate: startDate ? new Date(startDate) : new Date(),
        interval: interval ? parseInt(interval) : undefined,
        daysOfWeek: daysOfWeek ? parseDaysOfWeek(daysOfWeek) : undefined,
        dayOfMonth: dayOfMonth ? parseInt(dayOfMonth) : undefined,
        monthOfYear: monthOfYear ? parseInt(monthOfYear) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        timezone: timezone ?? undefined
    };
}

export function parseDaysOfWeek(daysOfWeek: string): number[] {
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

export function getDayOfWeekValue(daysOfWeek: number[]): string {
    // convert dto number (0-6) to string (SU, MO, TU, WE, TH, FR, SA)
    return daysOfWeek.map(day => {
        switch (day) {
            case 0: return 'SU';
            case 1: return 'MO';
            case 2: return 'TU';
            case 3: return 'WE';
            case 4: return 'TH';
            case 5: return 'FR';
            case 6: return 'SA';
            default: throw new Error(`Invalid day of week: ${day}`);
        }
    }).join(',');
}

export function buildRruleString(dto: CreateRecurringOrderScheduleDto | UpdateRecurringOrderScheduleDto): string {
    const parts: string[] = [];
    if (dto.frequency) {
        parts.push(`FREQ=${dto.frequency.toUpperCase()}`);
    }
    if (dto.interval) {
        parts.push(`INTERVAL=${dto.interval}`);
    }
    if (dto.daysOfWeek) {
        const dayOfWeekVal = getDayOfWeekValue(dto.daysOfWeek);
        parts.push(`BYDAY=${dayOfWeekVal}`);
    }
    if (dto.dayOfMonth) {
        parts.push(`BYMONTHDAY=${dto.dayOfMonth}`);
    }
    if (dto.monthOfYear) {
        parts.push(`BYMONTH=${dto.monthOfYear}`);
    }
    if (dto.startDate) {
        parts.push(`DTSTART=${dto.startDate}`);
    }
    if (dto.endDate) {
        parts.push(`UNTIL=${dto.endDate}`);
    }
    if (dto.timezone) {
        parts.push(`TIMEZONE=${dto.timezone}`);
    }

    return parts.join(';');
}