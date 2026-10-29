import { Square } from 'square';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { FulfillmentType } from '../../orders/utils/fulfillment-types';
import {
    SquareModifierSnapshot,
    SquareUnresolvedLineReason,
} from '../entities/square-unresolved-line.entity';
import { SquareModifierLink } from '../entities/square-modifier-link.entity';
import { SquareVariationLink } from '../entities/square-variation-link.entity';

/** The variation-link fields ingest reads, keyed by Square variation id. */
export type SquareOrderVariationMapping = Pick<
    SquareVariationLink,
    'enabled' | 'menuItemId' | 'menuItemSizeId' | 'modifierMode'
>;

/** The modifier-link fields ingest reads, keyed by Square modifier id. */
export type SquareOrderModifierMapping = Pick<
    SquareModifierLink,
    'enabled' | 'kind' | 'menuItemId' | 'menuItemSizeId'
>;

/** One `MenuItemContainerItem` row of a container menu item. */
export interface SquareContainerDefinitionItem {
    parentSizeId: number;
    menuItemId: number;
    menuItemSizeId: number;
    quantity: number;
}

/** A `CONTAINER` menu item's definition, for every size. */
export interface SquareOrderContainerDefinition {
    /** Null for a fixed container. */
    variableMaxAmount: number | null;
    items: SquareContainerDefinitionItem[];
}

export interface SquareOrderMappingInput {
    order: Square.Order;
    variations: ReadonlyMap<string, SquareOrderVariationMapping>;
    modifiers: ReadonlyMap<string, SquareOrderModifierMapping>;
    /** Container menu items by menu item id; other items are absent. */
    containers: ReadonlyMap<number, SquareOrderContainerDefinition>;
    /** The location link's IANA timezone; null if Square sent none. */
    timezone: string | null;
}

/** Why an order is left out of Petsi entirely (no order link is written). */
export type SquareOrderSkipReason =
    | 'missing_id'
    | 'draft'
    | 'cancelled'
    | 'no_pickup_or_delivery';

export interface PlannedContainerItem {
    menuItemId: number;
    menuItemSizeId: number;
    /** Per container. */
    quantity: number;
}

/**
 * One Petsi order item. A `modifier_is_item` Square line can plan several,
 * all with its uid (one per menu item and size).
 */
export interface PlannedSquareLine {
    squareLineUid: string;
    menuItemId: number;
    menuItemSizeId: number;
    quantity: number;
    /** Empty unless the menu item is a container. */
    containerItems: PlannedContainerItem[];
}

export interface PlannedUnresolvedLine {
    squareLineUid: string;
    squareVariationId: string | null;
    squareItemName: string | null;
    squareVariationName: string | null;
    squareModifiers: SquareModifierSnapshot[];
    reason: SquareUnresolvedLineReason;
    quantity: number;
    note: string | null;
}

/** The Square-owned order fields. Category is Petsi-owned and not here. */
export interface PlannedOrderFields {
    fulfillmentType: FulfillmentType;
    fulfillmentDate: Date;
    /** The due day (`YYYY-MM-DD`) in the location's timezone, if known. */
    fulfillmentLocalDate: string | null;
    recipient: string;
    phoneNumber: string | null;
    email: string | null;
    deliveryAddress: string | null;
}

export interface SquareOrderPlan {
    squareOrderId: string;
    squareLocationId: string;
    /** Square's order version as a decimal string (stored as bigint). */
    squareVersion: string;
    fields: PlannedOrderFields;
    lines: PlannedSquareLine[];
    unresolved: PlannedUnresolvedLine[];
    /** Every line uid in the Square order, placed, unresolved or skipped. */
    squareLineUids: string[];
}

export type SquareOrderMapping =
    | { kind: 'skip'; reason: SquareOrderSkipReason }
    | { kind: 'plan'; plan: SquareOrderPlan };

const IMPORTED_FULFILLMENT_TYPES: ReadonlySet<string> = new Set([
    'PICKUP',
    'DELIVERY',
]);

/**
 * Square order → a plan of Petsi order fields, lines and unresolved lines.
 * Pure: everything it needs (variation links, timezone) is passed in.
 * A whole-order problem (no recipient, no due time, a bad quantity) throws a
 * `ValidationException`, like an `OrderService` rejection. A line that can't
 * be placed exactly (including a box that breaks the container rules) is
 * planned as unresolved, never guessed.
 */
export function mapSquareOrder(
    input: SquareOrderMappingInput,
): SquareOrderMapping {
    const { order } = input;
    if (!order.id) {
        return { kind: 'skip', reason: 'missing_id' };
    }
    if (order.state === 'DRAFT') {
        return { kind: 'skip', reason: 'draft' };
    }
    // Auto-cancel of imported orders comes in task 17.
    if (order.state === 'CANCELED') {
        return { kind: 'skip', reason: 'cancelled' };
    }
    const fulfillment = findImportedFulfillment(order);
    if (!fulfillment) {
        return { kind: 'skip', reason: 'no_pickup_or_delivery' };
    }

    const errors = new ValidationErrorMap(order.id);
    const fields = mapFulfillmentFields(fulfillment, input.timezone, errors);

    const lines: PlannedSquareLine[] = [];
    const unresolved: PlannedUnresolvedLine[] = [];
    const squareLineUids: string[] = [];
    for (const [index, lineItem] of (order.lineItems ?? []).entries()) {
        // Square always sets uids on stored orders; the index keeps a line
        // without one stable within this version.
        const uid = lineItem.uid ?? `index-${index}`;
        squareLineUids.push(uid);
        const quantity = parseSquareQuantity(lineItem.quantity);
        if (quantity == null) {
            errors.addError('OUT_OF_RANGE', [uid], ['lineItems', 'quantity']);
            continue;
        }

        const placement = placeLine(lineItem, quantity, input);
        if (placement.kind === 'skip') {
            continue;
        }
        if (placement.kind === 'invalid_modifier_quantity') {
            errors.addError(
                'OUT_OF_RANGE',
                [uid],
                ['lineItems', 'modifiers', 'quantity'],
            );
            continue;
        }
        if (placement.kind === 'unresolved') {
            unresolved.push(
                toUnresolvedLine(lineItem, uid, quantity, placement.reason),
            );
            continue;
        }
        lines.push(
            ...placement.items.map((item) => ({
                squareLineUid: uid,
                ...item,
            })),
        );
    }

    if (!errors.isEmpty() || !fields) {
        throw new ValidationException(errors);
    }

    return {
        kind: 'plan',
        plan: {
            squareOrderId: order.id,
            squareLocationId: order.locationId,
            squareVersion: String(order.version ?? 0),
            fields,
            lines,
            unresolved,
            squareLineUids,
        },
    };
}

type PlacedItem = Omit<PlannedSquareLine, 'squareLineUid'>;

type LinePlacement =
    | { kind: 'skip' }
    | { kind: 'invalid_modifier_quantity' }
    | { kind: 'unresolved'; reason: SquareUnresolvedLineReason }
    | { kind: 'placed'; items: PlacedItem[] };

function placeLine(
    lineItem: Square.OrderLineItem,
    quantity: number,
    input: SquareOrderMappingInput,
): LinePlacement {
    if (!lineItem.catalogObjectId) {
        return { kind: 'unresolved', reason: 'ad_hoc' };
    }
    const link = input.variations.get(lineItem.catalogObjectId);
    if (link && !link.enabled) {
        return { kind: 'skip' };
    }
    if (!link) {
        return { kind: 'unresolved', reason: 'unmapped_variation' };
    }
    // The modifiers are the products; the variation needn't be mapped.
    if (link.modifierMode === 'modifier_is_item') {
        return placeModifierItems(lineItem, quantity, input.modifiers);
    }
    if (link.menuItemId == null || link.menuItemSizeId == null) {
        return { kind: 'unresolved', reason: 'unmapped_variation' };
    }
    const container = input.containers.get(link.menuItemId);
    if (link.modifierMode === 'container_contents') {
        return placeContainerContents(
            lineItem,
            quantity,
            {
                menuItemId: link.menuItemId,
                menuItemSizeId: link.menuItemSizeId,
            },
            container,
            input.modifiers,
        );
    }
    // A variable box without chosen contents would be a wrong box
    if (container && container.variableMaxAmount != null) {
        return { kind: 'unresolved', reason: 'container_invalid' };
    }
    return {
        kind: 'placed',
        items: [
            {
                menuItemId: link.menuItemId,
                menuItemSizeId: link.menuItemSizeId,
                quantity,
                // Neither the order composers nor the validator fill a fixed
                // container, and an empty one passes validation.
                containerItems: container
                    ? fixedContents(container, link.menuItemSizeId)
                    : [],
            },
        ],
    };
}

/** `modifier_is_item`: one order item per mapped item-modifier. */
function placeModifierItems(
    lineItem: Square.OrderLineItem,
    quantity: number,
    modifiers: ReadonlyMap<string, SquareOrderModifierMapping>,
): LinePlacement {
    const chosen = resolveModifierItems(lineItem, modifiers);
    if (chosen.kind !== 'resolved') {
        return chosen;
    }
    // Only ignored modifiers (or none): never import a flavorless line
    if (!chosen.items.length) {
        return { kind: 'unresolved', reason: 'unmapped_modifier' };
    }
    return {
        kind: 'placed',
        items: chosen.items.map((item) => ({
            ...item,
            quantity: item.quantity * quantity,
            containerItems: [],
        })),
    };
}

/**
 * `container_contents`: one box per unit of the line, filled from the
 * item-modifiers. The contents must pass the rules `OrderMenuItemValidator`
 * enforces (no duplicates, which merging guarantees; a total equal to the
 * box's maximum; only items the box allows for its size), or the line is
 * unresolved: a wrong box is never imported.
 */
function placeContainerContents(
    lineItem: Square.OrderLineItem,
    quantity: number,
    box: { menuItemId: number; menuItemSizeId: number },
    container: SquareOrderContainerDefinition | undefined,
    modifiers: ReadonlyMap<string, SquareOrderModifierMapping>,
): LinePlacement {
    const chosen = resolveModifierItems(lineItem, modifiers);
    if (chosen.kind !== 'resolved') {
        return chosen;
    }
    if (!container || container.variableMaxAmount == null) {
        return { kind: 'unresolved', reason: 'container_invalid' };
    }
    const allowed = new Set(
        container.items
            .filter((item) => item.parentSizeId === box.menuItemSizeId)
            .map((item) => itemKey(item.menuItemId, item.menuItemSizeId)),
    );
    const total = chosen.items.reduce((sum, item) => sum + item.quantity, 0);
    const allAllowed = chosen.items.every((item) =>
        allowed.has(itemKey(item.menuItemId, item.menuItemSizeId)),
    );
    if (total !== container.variableMaxAmount || !allAllowed) {
        return { kind: 'unresolved', reason: 'container_invalid' };
    }
    return {
        kind: 'placed',
        items: [{ ...box, quantity, containerItems: chosen.items }],
    };
}

/** A fixed container's defined contents for one size. */
function fixedContents(
    container: SquareOrderContainerDefinition,
    parentSizeId: number,
): PlannedContainerItem[] {
    return container.items
        .filter((item) => item.parentSizeId === parentSizeId)
        .map(({ menuItemId, menuItemSizeId, quantity }) => ({
            menuItemId,
            menuItemSizeId,
            quantity,
        }));
}

type ModifierItems =
    | { kind: 'invalid_modifier_quantity' }
    | { kind: 'unresolved'; reason: 'unmapped_modifier' }
    | { kind: 'resolved'; items: PlannedContainerItem[] };

/**
 * The line's item-modifiers merged by menu item and size, with quantities
 * per unit of the line. Ignored and disabled modifiers are left out; one
 * that is unmapped (or has no catalog id) leaves the line unresolved.
 */
function resolveModifierItems(
    lineItem: Square.OrderLineItem,
    modifiers: ReadonlyMap<string, SquareOrderModifierMapping>,
): ModifierItems {
    const merged = new Map<string, PlannedContainerItem>();
    for (const modifier of lineItem.modifiers ?? []) {
        const link = modifier.catalogObjectId
            ? modifiers.get(modifier.catalogObjectId)
            : undefined;
        if (link && (!link.enabled || link.kind === 'ignore')) {
            continue;
        }
        if (!link || link.menuItemId == null || link.menuItemSizeId == null) {
            return { kind: 'unresolved', reason: 'unmapped_modifier' };
        }
        // Modifier quantity defaults to 1 per unit of the line.
        const quantity = parseSquareQuantity(modifier.quantity ?? '1');
        if (quantity == null) {
            return { kind: 'invalid_modifier_quantity' };
        }
        const key = itemKey(link.menuItemId, link.menuItemSizeId);
        const existing = merged.get(key);
        if (existing) {
            existing.quantity += quantity;
        } else {
            merged.set(key, {
                menuItemId: link.menuItemId,
                menuItemSizeId: link.menuItemSizeId,
                quantity,
            });
        }
    }
    return { kind: 'resolved', items: [...merged.values()] };
}

function itemKey(menuItemId: number, menuItemSizeId: number): string {
    return `${menuItemId}:${menuItemSizeId}`;
}

function toUnresolvedLine(
    lineItem: Square.OrderLineItem,
    uid: string,
    quantity: number,
    reason: SquareUnresolvedLineReason,
): PlannedUnresolvedLine {
    return {
        squareLineUid: uid,
        squareVariationId: lineItem.catalogObjectId ?? null,
        squareItemName: lineItem.name ?? null,
        squareVariationName: lineItem.variationName ?? null,
        squareModifiers: (lineItem.modifiers ?? []).map((m) => ({
            squareModifierId: m.catalogObjectId ?? null,
            name: m.name ?? null,
            // Modifier quantity defaults to 1 per unit of the line.
            quantity: parseSquareQuantity(m.quantity ?? '1') ?? 1,
        })),
        reason,
        quantity,
        note: lineItem.note ?? null,
    };
}

/**
 * Fields from the first pickup/delivery fulfillment. Adds `MISSING_PROPERTY`
 * errors and returns null when Square left out the recipient or due time;
 * nothing is invented.
 */
function mapFulfillmentFields(
    fulfillment: Square.Fulfillment,
    timezone: string | null,
    errors: ValidationErrorMap,
): PlannedOrderFields | null {
    const isDelivery = fulfillment.type === 'DELIVERY';
    const details = isDelivery
        ? fulfillment.deliveryDetails
        : fulfillment.pickupDetails;
    const dueAt = fulfillmentDueAt(fulfillment);
    const recipient = details?.recipient;

    const recipientName = recipient?.displayName?.trim();
    if (!recipientName) {
        errors.addError('MISSING_PROPERTY', undefined, ['recipient']);
    }
    const fulfillmentDate = dueAt ? new Date(dueAt) : null;
    if (!fulfillmentDate || Number.isNaN(fulfillmentDate.getTime())) {
        errors.addError('MISSING_PROPERTY', undefined, ['fulfillmentDate']);
    }
    if (!recipientName || !fulfillmentDate) {
        return null;
    }

    return {
        fulfillmentType: isDelivery ? 'delivery' : 'pickup',
        fulfillmentDate,
        fulfillmentLocalDate: localDate(fulfillmentDate, timezone),
        recipient: recipientName,
        phoneNumber: recipient?.phoneNumber ?? null,
        email: recipient?.emailAddress ?? null,
        deliveryAddress: joinAddress(recipient?.address),
    };
}

/** The first pickup or delivery fulfillment: the one an order is imported by. */
export function findImportedFulfillment(
    order: Square.Order,
): Square.Fulfillment | undefined {
    return (order.fulfillments ?? []).find(
        (f) => f.type != null && IMPORTED_FULFILLMENT_TYPES.has(f.type),
    );
}

/** The fulfillment's due time (RFC 3339), if Square sent one. */
export function fulfillmentDueAt(
    fulfillment: Square.Fulfillment,
): string | null {
    return (
        (fulfillment.type === 'DELIVERY'
            ? fulfillment.deliveryDetails?.deliverAt
            : fulfillment.pickupDetails?.pickupAt) ?? null
    );
}

/** Address lines, locality and postal code, joined with `, `; null if empty. */
export function joinAddress(
    address: Square.Address | undefined,
): string | null {
    const parts = [
        address?.addressLine1,
        address?.addressLine2,
        address?.locality,
        address?.postalCode,
    ]
        .map((part) => part?.trim())
        .filter((part): part is string => !!part);
    return parts.length ? parts.join(', ') : null;
}

/**
 * Square quantities are decimal strings. Returns the positive integer they
 * hold (`"3"`, `"3.00"`), or null for anything else.
 */
export function parseSquareQuantity(
    quantity: string | null | undefined,
): number | null {
    const match = /^\s*(\d+)(?:\.0*)?\s*$/.exec(quantity ?? '');
    if (!match) {
        return null;
    }
    const value = Number(match[1]);
    return Number.isSafeInteger(value) && value > 0 ? value : null;
}

/** The calendar day of `date` in `timezone` as `YYYY-MM-DD`, or null. */
export function localDate(date: Date, timezone: string | null): string | null {
    if (!timezone) {
        return null;
    }
    try {
        // en-CA formats as YYYY-MM-DD
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(date);
    } catch {
        return null;
    }
}
