import { Square } from 'square';
import { ValidationException } from '../../../common/validation/validation-exception';
import {
    joinAddress,
    mapSquareOrder,
    parseSquareQuantity,
    SquareOrderMappingInput,
    SquareOrderPlan,
    SquareOrderVariationMapping,
} from './square-order-mapper';

const pie: SquareOrderVariationMapping = {
    enabled: true,
    menuItemId: 1,
    menuItemSizeId: 10,
    modifierMode: 'none',
};

const recipient: Square.FulfillmentRecipient = {
    displayName: 'Jane Doe',
    phoneNumber: '555-0100',
    emailAddress: 'jane@example.com',
};

function pickupOrder(overrides: Partial<Square.Order> = {}): Square.Order {
    return {
        id: 'ORDER-1',
        locationId: 'LOC-1',
        state: 'OPEN',
        version: 3,
        totalMoney: { amount: 2500n, currency: 'USD' },
        fulfillments: [
            {
                type: 'PICKUP',
                state: 'PROPOSED',
                pickupDetails: {
                    recipient,
                    pickupAt: '2026-11-02T03:30:00Z',
                },
            },
        ],
        lineItems: [
            {
                uid: 'line-pie',
                name: 'Apple Pie',
                variationName: 'Large',
                quantity: '2',
                catalogObjectId: 'VAR-PIE',
                catalogVersion: 1712345678901n,
                basePriceMoney: { amount: 1250n, currency: 'USD' },
                totalMoney: { amount: 2500n, currency: 'USD' },
            },
        ],
        ...overrides,
    };
}

function input(
    order: Square.Order,
    variations: Record<string, SquareOrderVariationMapping> = {
        'VAR-PIE': pie,
    },
): SquareOrderMappingInput {
    return {
        order,
        variations: new Map(Object.entries(variations)),
        timezone: 'America/New_York',
    };
}

function plan(
    order: Square.Order,
    variations?: Record<string, SquareOrderVariationMapping>,
): SquareOrderPlan {
    const result = mapSquareOrder(input(order, variations));
    if (result.kind !== 'plan') {
        throw new Error(`expected a plan, got skip: ${result.reason}`);
    }
    return result.plan;
}

describe('mapSquareOrder', () => {
    describe('scope', () => {
        it('skips an order without a pickup or delivery fulfillment', () => {
            const inStore = pickupOrder({
                fulfillments: [{ type: 'IN_STORE' }, { type: 'SHIPMENT' }],
            });
            expect(mapSquareOrder(input(inStore))).toEqual({
                kind: 'skip',
                reason: 'no_pickup_or_delivery',
            });
            expect(
                mapSquareOrder(input(pickupOrder({ fulfillments: undefined }))),
            ).toEqual({ kind: 'skip', reason: 'no_pickup_or_delivery' });
        });

        it('skips a draft', () => {
            expect(
                mapSquareOrder(input(pickupOrder({ state: 'DRAFT' }))),
            ).toEqual({ kind: 'skip', reason: 'draft' });
        });

        it('maps a completed order like an open one', () => {
            expect(plan(pickupOrder({ state: 'COMPLETED' }))).toEqual(
                plan(pickupOrder()),
            );
        });
    });

    describe('fields', () => {
        it('maps a pickup order from the fulfillment recipient', () => {
            expect(plan(pickupOrder()).fields).toEqual({
                fulfillmentType: 'pickup',
                fulfillmentDate: new Date('2026-11-02T03:30:00Z'),
                // 03:30 UTC is still Nov 1 in New York
                fulfillmentLocalDate: '2026-11-01',
                recipient: 'Jane Doe',
                phoneNumber: '555-0100',
                email: 'jane@example.com',
                deliveryAddress: null,
            });
        });

        it('maps a delivery order with the address joined into one string', () => {
            const order = pickupOrder({
                fulfillments: [
                    {
                        type: 'DELIVERY',
                        deliveryDetails: {
                            deliverAt: '2026-11-03T15:00:00Z',
                            recipient: {
                                ...recipient,
                                address: {
                                    addressLine1: '12 Main St',
                                    addressLine2: 'Apt 4',
                                    locality: 'Springfield',
                                    administrativeDistrictLevel1: 'MA',
                                    postalCode: '01101',
                                },
                            },
                        },
                    },
                ],
            });
            expect(plan(order).fields).toMatchObject({
                fulfillmentType: 'delivery',
                fulfillmentDate: new Date('2026-11-03T15:00:00Z'),
                deliveryAddress: '12 Main St, Apt 4, Springfield, 01101',
            });
        });

        it('stores the version as a string', () => {
            expect(plan(pickupOrder({ version: 12 })).squareVersion).toBe('12');
        });

        it('rejects an order without a recipient or due time', () => {
            const order = pickupOrder({
                fulfillments: [{ type: 'PICKUP', pickupDetails: {} }],
            });
            expect(() => mapSquareOrder(input(order))).toThrow(
                ValidationException,
            );
        });
    });

    describe('lines (modifierMode none)', () => {
        it('places a mapped variation with the parsed quantity', () => {
            const result = plan(pickupOrder());
            expect(result.lines).toEqual([
                {
                    squareLineUid: 'line-pie',
                    menuItemId: 1,
                    menuItemSizeId: 10,
                    quantity: 2,
                },
            ]);
            expect(result.unresolved).toEqual([]);
        });

        it('produces a JSON-safe plan from bigint money and versions', () => {
            expect(() => JSON.stringify(plan(pickupOrder()))).not.toThrow();
        });

        it('makes an ad-hoc line unresolved with its modifiers snapshotted', () => {
            const order = pickupOrder({
                lineItems: [
                    {
                        uid: 'line-custom',
                        name: 'Custom cake',
                        quantity: '1',
                        note: 'Happy birthday',
                        basePriceMoney: { amount: 4000n, currency: 'USD' },
                        modifiers: [
                            {
                                uid: 'm1',
                                catalogObjectId: 'MOD-1',
                                name: 'Candles',
                                quantity: '3',
                                basePriceMoney: {
                                    amount: 100n,
                                    currency: 'USD',
                                },
                            },
                        ],
                    },
                ],
            });
            const result = plan(order);
            expect(result.lines).toEqual([]);
            expect(result.unresolved).toEqual([
                {
                    squareLineUid: 'line-custom',
                    squareVariationId: null,
                    squareItemName: 'Custom cake',
                    squareVariationName: null,
                    squareModifiers: [
                        {
                            squareModifierId: 'MOD-1',
                            name: 'Candles',
                            quantity: 3,
                        },
                    ],
                    reason: 'ad_hoc',
                    quantity: 1,
                    note: 'Happy birthday',
                },
            ]);
        });

        it('makes an unknown or unmapped variation unresolved', () => {
            const order = pickupOrder({
                lineItems: [
                    { uid: 'a', quantity: '1', catalogObjectId: 'VAR-NEW' },
                    {
                        uid: 'b',
                        quantity: '1',
                        catalogObjectId: 'VAR-UNMAPPED',
                    },
                ],
            });
            const result = plan(order, {
                'VAR-UNMAPPED': { ...pie, menuItemSizeId: null },
            });
            expect(
                result.unresolved.map((l) => [l.squareLineUid, l.reason]),
            ).toEqual([
                ['a', 'unmapped_variation'],
                ['b', 'unmapped_variation'],
            ]);
        });

        it('skips a disabled variation silently', () => {
            const result = plan(pickupOrder(), {
                'VAR-PIE': { ...pie, enabled: false },
            });
            expect(result.lines).toEqual([]);
            expect(result.unresolved).toEqual([]);
            expect(result.squareLineUids).toEqual(['line-pie']);
        });

        it('rejects a fractional quantity', () => {
            const order = pickupOrder({
                lineItems: [
                    { uid: 'a', quantity: '1.5', catalogObjectId: 'VAR-PIE' },
                ],
            });
            expect(() => mapSquareOrder(input(order))).toThrow(
                ValidationException,
            );
        });
    });
});

describe('parseSquareQuantity', () => {
    it('parses whole-number decimal strings', () => {
        expect(parseSquareQuantity('3')).toBe(3);
        expect(parseSquareQuantity('3.000')).toBe(3);
    });

    it('rejects zero, fractions and garbage', () => {
        expect(parseSquareQuantity('0')).toBeNull();
        expect(parseSquareQuantity('2.5')).toBeNull();
        expect(parseSquareQuantity('-1')).toBeNull();
        expect(parseSquareQuantity('')).toBeNull();
        expect(parseSquareQuantity(undefined)).toBeNull();
    });
});

describe('joinAddress', () => {
    it('skips empty parts', () => {
        expect(
            joinAddress({
                addressLine1: '1 Elm St',
                addressLine2: ' ',
                postalCode: '02139',
            }),
        ).toBe('1 Elm St, 02139');
    });

    it('is null without an address', () => {
        expect(joinAddress(undefined)).toBeNull();
        expect(joinAddress({})).toBeNull();
    });
});
