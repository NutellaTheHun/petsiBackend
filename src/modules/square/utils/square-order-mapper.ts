import { Square } from 'square';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { FulfillmentType } from '../../orders/utils/fulfillment-types';
import {
    SquareModifierSnapshot,
    SquareUnresolvedLineReason,
} from '../entities/square-unresolved-line.entity';
import { SquareVariationLink } from '../entities/square-variation-link.entity';

/** The variation-link fields ingest reads, keyed by Square variation id. */
export type SquareOrderVariationMapping = Pick<
    SquareVariationLink,
    'enabled' | 'menuItemId' | 'menuItemSizeId' | 'modifierMode'
>;

export interface SquareOrderMappingInput {
    order: Square.Order;
    variations: ReadonlyMap<string, SquareOrderVariationMapping>;
    /** The location link's IANA timezone; null if Square sent none. */
    timezone: string | null;
}

/** Why an order is left out of Petsi entirely (no order link is written). */
export type SquareOrderSkipReason =
    | 'missing_id'
    | 'draft'
    | 'cancelled'
    | 'no_pickup_or_delivery';

export interface PlannedSquareLine {
    squareLineUid: string;
    menuItemId: number;
    menuItemSizeId: number;
    quantity: number;
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
 * `ValidationException`, like an `OrderService` rejection.
 * Only `modifierMode = none` places lines; the other modes come in task 13
 * and leave the line unresolved until then.
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
    const fulfillment = (order.fulfillments ?? []).find(
        (f) => f.type != null && IMPORTED_FULFILLMENT_TYPES.has(f.type),
    );
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

        const placement = placeLine(lineItem, input.variations);
        if (placement.kind === 'skip') {
            continue;
        }
        if (placement.kind === 'unresolved') {
            unresolved.push(
                toUnresolvedLine(lineItem, uid, quantity, placement.reason),
            );
            continue;
        }
        lines.push({
            squareLineUid: uid,
            menuItemId: placement.menuItemId,
            menuItemSizeId: placement.menuItemSizeId,
            quantity,
        });
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

type LinePlacement =
    | { kind: 'skip' }
    | { kind: 'unresolved'; reason: SquareUnresolvedLineReason }
    | { kind: 'placed'; menuItemId: number; menuItemSizeId: number };

function placeLine(
    lineItem: Square.OrderLineItem,
    variations: ReadonlyMap<string, SquareOrderVariationMapping>,
): LinePlacement {
    if (!lineItem.catalogObjectId) {
        return { kind: 'unresolved', reason: 'ad_hoc' };
    }
    const link = variations.get(lineItem.catalogObjectId);
    if (link && !link.enabled) {
        return { kind: 'skip' };
    }
    if (!link || link.menuItemId == null || link.menuItemSizeId == null) {
        return { kind: 'unresolved', reason: 'unmapped_variation' };
    }
    switch (link.modifierMode) {
        case 'none':
            return {
                kind: 'placed',
                menuItemId: link.menuItemId,
                menuItemSizeId: link.menuItemSizeId,
            };
        // Placed by task 13; never import a wrong box or a flavorless line.
        case 'modifier_is_item':
            return { kind: 'unresolved', reason: 'unmapped_modifier' };
        case 'container_contents':
            return { kind: 'unresolved', reason: 'container_invalid' };
    }
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
    const dueAt = isDelivery
        ? fulfillment.deliveryDetails?.deliverAt
        : fulfillment.pickupDetails?.pickupAt;
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
