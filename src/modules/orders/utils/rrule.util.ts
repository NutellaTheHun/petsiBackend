import { CreateRecurringOrderScheduleDto } from "../dto/recurring-order-schedule/create-recurring-order-schedule.dto";
import { UpdateRecurringOrderScheduleDto } from "../dto/recurring-order-schedule/update-recurring-order-schedule.dto";

/**
 * Parse a rrule string with the following format:
 * "DTSTART:20120201T093000Z\nRRULE:FREQ=WEEKLY;INTERVAL=5;UNTIL=20130130T230000Z;BYDAY=MO,FR"
 * So there is the DTSTART:... and the RRULE:...
 */
export function parseRruleString(rruleString: string): { frequency: string; interval: number | undefined; daysOfWeek: number[] | undefined; dayOfMonth: number | undefined; monthOfYear: number | undefined; startDate: Date; endDate: Date | undefined; timezone: string | undefined; } {
    if (!rruleString || !rruleString.includes('RRULE:')) {
        return {
            frequency: 'WEEKLY',
            startDate: new Date(),
            interval: undefined,
            daysOfWeek: undefined,
            dayOfMonth: undefined,
            monthOfYear: undefined,
            endDate: undefined,
            timezone: undefined,
        };
    }

    const lines = (rruleString ?? '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

    const dtstartPart = lines.find((l) => l.startsWith('DTSTART:'));
    const rrulePart = lines.find((l) => l.startsWith('RRULE:'));

    const startDate = dtstartPart
        ? parseDtStart(dtstartPart.split(':')[1])
        : new Date();

    const rrule = (rrulePart ?? rruleString).split('RRULE:')[1];
    if (!rrule) {
        throw new Error('RRULE is required');
    }
    const parts = rrule.split(';');
    const partsMap = new Map<string, string>();
    for (const part of parts) {
        const [key, value] = part.split('=');
        partsMap.set(key, value);
    }

    const frequency = partsMap.get('FREQ');
    if (!frequency) {
        throw new Error('Frequency is required');
    }
    const interval = partsMap.get('INTERVAL');
    const daysOfWeek = partsMap.get('BYDAY');
    const dayOfMonth = partsMap.get('BYMONTHDAY');
    const monthOfYear = partsMap.get('BYMONTH');
    const endDate = partsMap.get('UNTIL');
    const timezone = partsMap.get('TIMEZONE');

    return {
        frequency,
        startDate: startDate,
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

/**
 * Build a rrule string from a DTO to be stored in a recurring order schedule entity.
 */
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
        //parts.push(`DTSTART=${dto.startDate}`);
    }
    if (dto.endDate) {
        parts.push(`UNTIL=${buildRRULEDateString(dto.endDate)}`);
    }
    if (dto.timezone) {
        parts.push(`TIMEZONE=${dto.timezone}`);
    }

    return `RRULE:${parts.join(';')}`;
}

/**
 * Build a DTSTART or UNTILstring from a date to be stored in a recurring order schedule entity.
 * The date is expected to be in the UTC timezone.
 */
export function buildRRULEDateString(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `DTSTART:${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function parseDtStart(value: string): Date {
    // Example: 20120201T093000Z
    const year = parseInt(value.slice(0, 4));
    const month = parseInt(value.slice(4, 6)) - 1; // JS months are 0-based
    const day = parseInt(value.slice(6, 8));
    const hour = parseInt(value.slice(9, 11));
    const minute = parseInt(value.slice(11, 13));
    const second = parseInt(value.slice(13, 15));

    return new Date(Date.UTC(year, month, day, hour, minute, second));
}