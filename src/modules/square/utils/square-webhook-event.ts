/** The webhook event types Petsi subscribes to. */
export const SQUARE_ORDER_EVENT_TYPES = [
    'order.created',
    'order.updated',
    'order.fulfillment.updated',
] as const;

export type SquareOrderEventType = (typeof SQUARE_ORDER_EVENT_TYPES)[number];

/** `data.object` key carrying the order ids, per order event type. */
const ORDER_OBJECT_KEYS: Record<SquareOrderEventType, string> = {
    'order.created': 'order_created',
    'order.updated': 'order_updated',
    'order.fulfillment.updated': 'order_fulfillment_updated',
};

type EnvelopeFields = { eventId: string; merchantId: string; type: string };

/**
 * A verified webhook body reduced to what Petsi reads. Order events carry
 * only ids, so the full order is always re-fetched; `catalog.version.updated`
 * carries only a timestamp. Anything else is `ignored`.
 */
export type SquareWebhookEvent = EnvelopeFields &
    (
        | {
              kind: 'order';
              type: SquareOrderEventType;
              orderId: string;
              /** A bigint, as a string. */
              version: string | null;
          }
        | { kind: 'catalog' }
        | { kind: 'revoked' }
        | { kind: 'ignored' }
    );

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOrderEventType(type: string): type is SquareOrderEventType {
    return (SQUARE_ORDER_EVENT_TYPES as readonly string[]).includes(type);
}

/** Integer versions only; anything else is treated as absent. */
function parseVersion(value: unknown): string | null {
    if (typeof value === 'number' && Number.isSafeInteger(value)) {
        return String(value);
    }
    if (typeof value === 'string' && /^\d+$/.test(value)) {
        return value;
    }
    return null;
}

/**
 * Parses a webhook body (Square's snake_case wire format). Returns `null` when
 * the envelope has no event id or merchant id, or an order event has no order
 * id: there is nothing to route or dedupe on.
 */
export function parseSquareWebhookEvent(
    body: unknown,
): SquareWebhookEvent | null {
    if (!isRecord(body)) {
        return null;
    }
    const { event_id: eventId, merchant_id: merchantId, type } = body;
    if (
        typeof eventId !== 'string' ||
        !eventId ||
        typeof merchantId !== 'string' ||
        !merchantId ||
        typeof type !== 'string'
    ) {
        return null;
    }
    const envelope = { eventId, merchantId, type };

    if (type === 'catalog.version.updated') {
        return { ...envelope, kind: 'catalog' };
    }
    if (type === 'oauth.authorization.revoked') {
        return { ...envelope, kind: 'revoked' };
    }
    if (!isOrderEventType(type)) {
        return { ...envelope, kind: 'ignored', type };
    }

    const data = isRecord(body.data) ? body.data : undefined;
    const object = isRecord(data?.object) ? data.object : undefined;
    const ids = object?.[ORDER_OBJECT_KEYS[type]];
    if (!isRecord(ids)) {
        return null;
    }
    const orderId = ids.order_id;
    if (typeof orderId !== 'string' || !orderId) {
        return null;
    }
    return {
        ...envelope,
        kind: 'order',
        type,
        orderId,
        version: parseVersion(ids.version),
    };
}
