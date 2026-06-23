import { Order } from '../../entities/order.entity';

export const ORDER_SNAPSHOT_PAYLOAD_VERSION = 1 as const;

export type OrderSnapshotPayloadVersion = typeof ORDER_SNAPSHOT_PAYLOAD_VERSION;

export interface OrderContainerItemSnapshotV1 {
    containedMenuItemId: number;
    containedItemSizeId: number;
    quantity: number;
}

export interface OrderMenuItemSnapshotLineV1 {
    menuItemId: number;
    sizeId: number | null;
    quantity: number;
    containerItems: OrderContainerItemSnapshotV1[];
}

export interface OrderRecurrenceScheduleSnapshotV1 {
    rrule: string;
    startDate: string;
    endDate: string | null;
    timezone: string | null;
}

/** Persisted under revision_history.payload for orders. */
export interface OrderSnapshotV1 {
    payloadVersion: OrderSnapshotPayloadVersion;
    recipient: string;
    fulfillmentDate: string;
    fulfillmentType: string;
    fulfillmentContactName: string | null;
    deliveryAddress: string | null;
    phoneNumber: string | null;
    email: string | null;
    note: string | null;
    isFrozen: boolean;
    categoryId: number | null;
    orderedItems: OrderMenuItemSnapshotLineV1[];
    recurrenceSchedule: OrderRecurrenceScheduleSnapshotV1 | null;
    occurrenceType: string | null;
    occurrenceState: string | null;
    recurrenceDate: string | null;
    templateOrderId: number | null;
}

export function isOrderSnapshotV1(v: unknown): v is OrderSnapshotV1 {
    return (
        typeof v === 'object' &&
        v !== null &&
        (v as OrderSnapshotV1).payloadVersion === ORDER_SNAPSHOT_PAYLOAD_VERSION
    );
}

export function orderToSnapshotV1(order: Order): OrderSnapshotV1 {
    return {
        payloadVersion: ORDER_SNAPSHOT_PAYLOAD_VERSION,
        recipient: order.recipient,
        fulfillmentDate:
            order.fulfillmentDate instanceof Date
                ? order.fulfillmentDate.toISOString()
                : String(order.fulfillmentDate),
        fulfillmentType: order.fulfillmentType,
        fulfillmentContactName: order.fulfillmentContactName ?? null,
        deliveryAddress: order.deliveryAddress ?? null,
        phoneNumber: order.phoneNumber ?? null,
        email: order.email ?? null,
        note: order.note ?? null,
        isFrozen: order.isFrozen,
        categoryId: order.category?.id ?? null,
        orderedItems: (order.orderedItems ?? []).map((line) => ({
            menuItemId: line.menuItem.id,
            sizeId: line.size?.id ?? null,
            quantity: line.quantity,
            containerItems: (line.containerOrderMenuItems ?? []).map((c) => ({
                containedMenuItemId: c.containedMenuItem.id,
                containedItemSizeId: c.containedItemSize.id,
                quantity: Number(c.quantity),
            })),
        })),
        recurrenceSchedule: order.recurrenceSchedule
            ? {
                  rrule: order.recurrenceSchedule.rrule,
                  startDate:
                      order.recurrenceSchedule.startDate instanceof Date
                          ? order.recurrenceSchedule.startDate.toISOString()
                          : String(order.recurrenceSchedule.startDate),
                  endDate: order.recurrenceSchedule.endDate
                      ? order.recurrenceSchedule.endDate instanceof Date
                          ? order.recurrenceSchedule.endDate.toISOString()
                          : String(order.recurrenceSchedule.endDate)
                      : null,
                  timezone: order.recurrenceSchedule.timezone ?? null,
              }
            : null,
        occurrenceType: order.occurrenceType ?? null,
        occurrenceState: order.occurrenceState ?? null,
        recurrenceDate: order.recurrenceDate
            ? order.recurrenceDate instanceof Date
                ? order.recurrenceDate.toISOString()
                : String(order.recurrenceDate)
            : null,
        templateOrderId: order.templateOrderId ?? null,
    };
}
