import { parseSquareWebhookEvent } from './square-webhook-event';

const envelope = (type: string, object: Record<string, unknown> = {}) => ({
    merchant_id: 'M1',
    type,
    event_id: 'e1',
    created_at: '2026-10-29T12:00:00Z',
    data: { type: type.split('.')[0], id: 'o1', object },
});

describe('parseSquareWebhookEvent', () => {
    it.each([
        ['order.created', 'order_created'],
        ['order.updated', 'order_updated'],
        ['order.fulfillment.updated', 'order_fulfillment_updated'],
    ])('reads the order id and version of %s', (type, key) => {
        expect(
            parseSquareWebhookEvent(
                envelope(type, {
                    [key]: { order_id: 'o1', version: 3, state: 'OPEN' },
                }),
            ),
        ).toEqual({
            eventId: 'e1',
            merchantId: 'M1',
            type,
            kind: 'order',
            orderId: 'o1',
            version: '3',
        });
    });

    it('treats a missing or non-integer version as absent', () => {
        const event = parseSquareWebhookEvent(
            envelope('order.updated', {
                order_updated: { order_id: 'o1', version: 1.5 },
            }),
        );
        expect(event).toMatchObject({ kind: 'order', version: null });
    });

    it('reads catalog, revocation and unknown events', () => {
        expect(
            parseSquareWebhookEvent(
                envelope('catalog.version.updated', {
                    catalog_version: { updated_at: '2026-10-29T12:00:00Z' },
                }),
            ),
        ).toMatchObject({ kind: 'catalog' });
        expect(
            parseSquareWebhookEvent(envelope('oauth.authorization.revoked')),
        ).toMatchObject({ kind: 'revoked', merchantId: 'M1' });
        expect(
            parseSquareWebhookEvent(envelope('payment.created')),
        ).toMatchObject({ kind: 'ignored', type: 'payment.created' });
    });

    it.each([
        ['a non-object', 'nope'],
        ['no event id', { ...envelope('order.created'), event_id: undefined }],
        ['no merchant id', { ...envelope('order.created'), merchant_id: '' }],
        [
            'an order event without an order id',
            envelope('order.created', { order_created: { version: 1 } }),
        ],
        [
            'an order event under the wrong key',
            envelope('order.created', { order_updated: { order_id: 'o1' } }),
        ],
    ])('returns null for %s', (_label, body) => {
        expect(parseSquareWebhookEvent(body)).toBeNull();
    });
});
