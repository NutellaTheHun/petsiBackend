/**
 * General order status, independent of the recurrence-only `occurrenceState`.
 * Cancelled orders are excluded from reports and default order lists, the
 * same way frozen orders are.
 */
export const ORDER_STATUSES = {
    ACTIVE: 'ACTIVE',
    CANCELLED: 'CANCELLED',
} as const;
export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];
