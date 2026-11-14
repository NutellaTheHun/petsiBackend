import { Square } from 'square';
import {
    findImportedFulfillment,
    fulfillmentDueAt,
    localDate,
} from './square-order-mapper';

/**
 * Whether the initial import / re-sync keeps `order`: its pickup or delivery
 * is due today or later, by the calendar day in the location's `timezone`
 * (UTC when the link has none or it isn't a valid IANA zone). An order with no
 * pickup/delivery fulfillment or no due time is left out.
 * Pure: `now` is passed in.
 */
export function isDueTodayOrLater(
    order: Square.Order,
    timezone: string | null,
    now: Date,
): boolean {
    const fulfillment = findImportedFulfillment(order);
    const dueAt = fulfillment ? fulfillmentDueAt(fulfillment) : null;
    const due = dueAt ? new Date(dueAt) : null;
    if (!due || Number.isNaN(due.getTime())) {
        return false;
    }
    const zone = timezone && localDate(now, timezone) ? timezone : 'UTC';
    // YYYY-MM-DD strings compare in calendar order
    return localDate(due, zone)! >= localDate(now, zone)!;
}
