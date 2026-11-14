import { NestedCreateOrderContainerItemDto } from '../dto/order-container-item/nested-create-order-container-item.dto';
import { NestedUpdateOrderContainerItemDto } from '../dto/order-container-item/nested-update-order-container-item.dto';
import { NestedCreateOrderMenuItemDto } from '../dto/order-menu-item/nested-create-order-menu-item.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';

/**
 * Order fields Square owns while the order is linked. `note` and
 * `fulfillmentContactName` stay Petsi's: ingest never writes them.
 */
export const SQUARE_OWNED_ORDER_FIELDS = [
    'recipient',
    'fulfillmentDate',
    'fulfillmentType',
    'phoneNumber',
    'email',
    'deliveryAddress',
] as const;

export interface SquareOwnershipViolations {
    /** Square-owned order fields the update changes. */
    fields: string[];
    /** Square-derived items the update leaves out (removes). */
    removedLineIds: number[];
    /** Square-derived items the update changes, with the changed fields. */
    changedLines: { id: number; fields: string[] }[];
}

/** `undefined` means "not sent": unchanged. */
function changed(next: unknown, current: unknown): boolean {
    if (next === undefined) return false;
    if (next instanceof Date || current instanceof Date) {
        const a = next == null ? null : new Date(next as Date).getTime();
        const b = current == null ? null : new Date(current as Date).getTime();
        return a !== b;
    }
    return (next ?? null) !== (current ?? null);
}

function containerContentsChanged(
    next: (
        | NestedCreateOrderContainerItemDto
        | NestedUpdateOrderContainerItemDto
    )[],
    current: OrderMenuItem,
): boolean {
    const currentById = new Map(
        (current.containerOrderMenuItems ?? []).map((item) => [item.id, item]),
    );
    if (next.length !== currentById.size) return true;
    return next.some((item) => {
        if (item instanceof NestedCreateOrderContainerItemDto) return true;
        const existing = currentById.get(item.id);
        return (
            !existing ||
            changed(item.containedMenuItemId, existing.containedMenuItem.id) ||
            changed(item.containedItemSizeId, existing.containedItemSize.id) ||
            changed(item.quantity, existing.quantity)
        );
    });
}

/**
 * What a staff update changes of a Square-linked order's Square-owned data:
 * the fields in `SQUARE_OWNED_ORDER_FIELDS`, and the Square-derived items
 * (`squareLineIds`) with their container contents. Values equal to the
 * current ones are not changes, so a full DTO echoing the order passes.
 *
 * @param current the order with `orderedItems` (menu item, size and
 * container contents with their menu item and size) loaded.
 */
export function squareOwnershipViolations(
    current: Order,
    squareLineIds: ReadonlySet<number>,
    dto: Pick<
        UpdateOrderDto,
        (typeof SQUARE_OWNED_ORDER_FIELDS)[number] | 'orderedItems'
    >,
): SquareOwnershipViolations {
    const fields = SQUARE_OWNED_ORDER_FIELDS.filter((field) =>
        changed(dto[field], current[field]),
    );

    const removedLineIds: number[] = [];
    const changedLines: { id: number; fields: string[] }[] = [];
    if (dto.orderedItems !== undefined) {
        const sentById = new Map(
            dto.orderedItems.flatMap((item) =>
                item instanceof NestedCreateOrderMenuItemDto
                    ? []
                    : [[item.id, item] as const],
            ),
        );
        for (const existing of current.orderedItems ?? []) {
            if (!squareLineIds.has(existing.id)) continue;
            const sent = sentById.get(existing.id);
            if (!sent) {
                removedLineIds.push(existing.id);
                continue;
            }
            const lineFields: string[] = [];
            if (changed(sent.menuItemId, existing.menuItem.id)) {
                lineFields.push('menuItemId');
            }
            if (changed(sent.sizeId, existing.size?.id)) {
                lineFields.push('sizeId');
            }
            if (changed(sent.quantity, existing.quantity)) {
                lineFields.push('quantity');
            }
            if (
                sent.containerOrderMenuItems !== undefined &&
                containerContentsChanged(sent.containerOrderMenuItems, existing)
            ) {
                lineFields.push('containerOrderMenuItems');
            }
            if (lineFields.length) {
                changedLines.push({ id: existing.id, fields: lineFields });
            }
        }
    }

    return { fields, removedLineIds, changedLines };
}
