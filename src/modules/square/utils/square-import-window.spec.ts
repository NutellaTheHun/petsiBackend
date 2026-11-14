import { Square } from 'square';
import { isDueTodayOrLater } from './square-import-window';

const pickupAt = (at: string | undefined): Square.Order => ({
    locationId: 'loc',
    fulfillments: [{ type: 'PICKUP', pickupDetails: { pickupAt: at } }],
});

const deliverAt = (at: string): Square.Order => ({
    locationId: 'loc',
    fulfillments: [{ type: 'DELIVERY', deliveryDetails: { deliverAt: at } }],
});

// 2026-11-02 01:30 UTC = 2026-11-01 20:30 in New York (EST, UTC-5)
const now = new Date('2026-11-02T01:30:00Z');

describe('isDueTodayOrLater', () => {
    it('keeps an order due later today in the location timezone', () => {
        // 23:00 New York on Nov 1: already "yesterday" in UTC terms
        expect(
            isDueTodayOrLater(
                pickupAt('2026-11-02T04:00:00Z'),
                'America/New_York',
                now,
            ),
        ).toBe(true);
    });

    it('keeps an order due earlier today in the location timezone', () => {
        // 09:00 New York on Nov 1: before `now`, but the same local day
        expect(
            isDueTodayOrLater(
                pickupAt('2026-11-01T14:00:00Z'),
                'America/New_York',
                now,
            ),
        ).toBe(true);
    });

    it('skips an order due on a past local day', () => {
        expect(
            isDueTodayOrLater(
                pickupAt('2026-10-31T22:00:00Z'),
                'America/New_York',
                now,
            ),
        ).toBe(false);
    });

    it('judges the day in UTC when the timezone is missing or invalid', () => {
        // Nov 1 14:00 UTC is a past day in UTC (now is Nov 2 UTC)
        const order = pickupAt('2026-11-01T14:00:00Z');
        expect(isDueTodayOrLater(order, null, now)).toBe(false);
        expect(isDueTodayOrLater(order, 'Not/AZone', now)).toBe(false);
    });

    it('reads a delivery due time', () => {
        expect(
            isDueTodayOrLater(deliverAt('2026-11-05T15:00:00Z'), 'UTC', now),
        ).toBe(true);
    });

    it.each([
        ['no due time', pickupAt(undefined)],
        ['an unparseable due time', pickupAt('soon')],
        [
            'no pickup or delivery fulfillment',
            { locationId: 'loc', fulfillments: [{ type: 'IN_STORE' }] },
        ],
    ] as [string, Square.Order][])('skips an order with %s', (_l, order) => {
        expect(isDueTodayOrLater(order, 'UTC', now)).toBe(false);
    });
});
