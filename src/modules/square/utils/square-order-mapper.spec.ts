import { Square } from 'square';
import { ValidationException } from '../../../common/validation/validation-exception';
import {
    isSquareOrderCancelled,
    joinAddress,
    mapSquareOrder,
    parseSquareQuantity,
    SquareAdHocMapping,
    SquareOrderContainerDefinition,
    SquareOrderMappingInput,
    SquareOrderModifierMapping,
    SquareOrderPlan,
    SquareOrderVariationMapping,
    squareRefundSummary,
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

interface Catalog {
    modifiers?: Record<string, SquareOrderModifierMapping>;
    containers?: Map<number, SquareOrderContainerDefinition>;
}

function input(
    order: Square.Order,
    variations: Record<string, SquareOrderVariationMapping> = {
        'VAR-PIE': pie,
    },
    catalog: Catalog = {},
): SquareOrderMappingInput {
    return {
        order,
        variations: new Map(Object.entries(variations)),
        modifiers: new Map(Object.entries(catalog.modifiers ?? {})),
        containers: catalog.containers ?? new Map(),
        timezone: 'America/New_York',
    };
}

function plan(
    order: Square.Order,
    variations?: Record<string, SquareOrderVariationMapping>,
    catalog?: Catalog,
): SquareOrderPlan {
    const result = mapSquareOrder(input(order, variations, catalog));
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
                    containerItems: [],
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

    describe('modifier modes and containers', () => {
        // Menu items: 2 scone (size 20), 3 chocolate chip and 4 oatmeal
        // cookies (size 30), 5 box of 6 cookies (size 50), 7 fixed platter
        // (sizes 70 and 71).
        const scone: SquareOrderVariationMapping = {
            enabled: true,
            menuItemId: null,
            menuItemSizeId: null,
            modifierMode: 'modifier_is_item',
        };
        const box: SquareOrderVariationMapping = {
            enabled: true,
            menuItemId: 5,
            menuItemSizeId: 50,
            modifierMode: 'container_contents',
        };
        const platter: SquareOrderVariationMapping = {
            enabled: true,
            menuItemId: 7,
            menuItemSizeId: 70,
            modifierMode: 'none',
        };
        const variations = {
            'VAR-PIE': pie,
            'VAR-SCONE': scone,
            'VAR-BOX': box,
            'VAR-PLATTER': platter,
        };

        const mapped = (
            menuItemId: number,
            menuItemSizeId: number,
        ): SquareOrderModifierMapping => ({
            enabled: true,
            kind: 'item',
            menuItemId,
            menuItemSizeId,
        });
        const modifiers: Record<string, SquareOrderModifierMapping> = {
            'MOD-LEMON': mapped(2, 20),
            // One flavor per box slot: two modifier objects, one product
            'MOD-CHOC-1': mapped(3, 30),
            'MOD-CHOC-2': mapped(3, 30),
            'MOD-OAT-1': mapped(4, 30),
            'MOD-SHOT': {
                enabled: true,
                kind: 'ignore',
                menuItemId: null,
                menuItemSizeId: null,
            },
            'MOD-UNMAPPED': { ...mapped(2, 20), menuItemId: null },
            'MOD-DISABLED': { ...mapped(2, 20), enabled: false },
        };
        const containers = new Map<number, SquareOrderContainerDefinition>([
            [
                5,
                {
                    variableMaxAmount: 6,
                    items: [
                        {
                            parentSizeId: 50,
                            menuItemId: 3,
                            menuItemSizeId: 30,
                            quantity: 1,
                        },
                        {
                            parentSizeId: 50,
                            menuItemId: 4,
                            menuItemSizeId: 30,
                            quantity: 1,
                        },
                    ],
                },
            ],
            [
                7,
                {
                    variableMaxAmount: null,
                    items: [
                        {
                            parentSizeId: 70,
                            menuItemId: 2,
                            menuItemSizeId: 20,
                            quantity: 3,
                        },
                        {
                            parentSizeId: 70,
                            menuItemId: 4,
                            menuItemSizeId: 30,
                            quantity: 3,
                        },
                        {
                            parentSizeId: 71,
                            menuItemId: 2,
                            menuItemSizeId: 20,
                            quantity: 5,
                        },
                    ],
                },
            ],
        ]);

        const lineWith = (
            uid: string,
            catalogObjectId: string,
            quantity: string,
            mods: [string | undefined, string?][],
        ): Square.OrderLineItem => ({
            uid,
            name: uid,
            quantity,
            catalogObjectId,
            modifiers: mods.map(([id, modQuantity], i) => ({
                uid: `${uid}-m${i}`,
                catalogObjectId: id,
                name: id ?? 'custom',
                quantity: modQuantity,
            })),
        });

        const line = (
            uid: string,
            catalogObjectId: string,
            quantity = '1',
        ): Square.OrderLineItem => ({ uid, quantity, catalogObjectId });

        const planLines = (...lineItems: Square.OrderLineItem[]) =>
            plan(pickupOrder({ lineItems }), variations, {
                modifiers,
                containers,
            });

        const reasons = (result: SquareOrderPlan) =>
            result.unresolved.map((l) => [l.squareLineUid, l.reason]);

        describe('modifier_is_item', () => {
            it('places one item per item-modifier, line quantity × modifier quantity', () => {
                const result = planLines(
                    lineWith('scone', 'VAR-SCONE', '2', [
                        ['MOD-LEMON', '3'],
                        ['MOD-OAT-1'],
                        ['MOD-SHOT'],
                    ]),
                );
                expect(result.lines).toEqual([
                    {
                        squareLineUid: 'scone',
                        menuItemId: 2,
                        menuItemSizeId: 20,
                        quantity: 6,
                        containerItems: [],
                    },
                    {
                        squareLineUid: 'scone',
                        menuItemId: 4,
                        menuItemSizeId: 30,
                        quantity: 2,
                        containerItems: [],
                    },
                ]);
                expect(result.unresolved).toEqual([]);
            });

            it('merges modifiers mapped to the same product', () => {
                const result = planLines(
                    lineWith('scone', 'VAR-SCONE', '2', [
                        ['MOD-CHOC-1'],
                        ['MOD-CHOC-2', '2'],
                    ]),
                );
                expect(result.lines).toMatchObject([
                    { menuItemId: 3, menuItemSizeId: 30, quantity: 6 },
                ]);
            });

            it('skips ignored and disabled modifiers', () => {
                const result = planLines(
                    lineWith('scone', 'VAR-SCONE', '1', [
                        ['MOD-LEMON'],
                        ['MOD-SHOT'],
                        ['MOD-DISABLED'],
                    ]),
                );
                expect(result.lines).toMatchObject([
                    { menuItemId: 2, quantity: 1 },
                ]);
                expect(result.unresolved).toEqual([]);
            });

            it.each([
                ['an unmapped modifier', [['MOD-LEMON'], ['MOD-UNMAPPED']]],
                ['an unknown modifier', [['MOD-LEMON'], ['MOD-NEW']]],
                ['a custom modifier', [['MOD-LEMON'], [undefined]]],
                ['only ignored modifiers', [['MOD-SHOT']]],
            ] as [string, [string | undefined][]][])(
                'makes the line unmapped_modifier for %s',
                (_label, mods) => {
                    const result = planLines(
                        lineWith('scone', 'VAR-SCONE', '1', mods),
                        line('pie', 'VAR-PIE'),
                    );
                    expect(result.lines.map((l) => l.squareLineUid)).toEqual([
                        'pie',
                    ]);
                    expect(reasons(result)).toEqual([
                        ['scone', 'unmapped_modifier'],
                    ]);
                },
            );

            it('rejects a fractional modifier quantity', () => {
                const order = pickupOrder({
                    lineItems: [
                        lineWith('scone', 'VAR-SCONE', '1', [
                            ['MOD-LEMON', '0.5'],
                        ]),
                    ],
                });
                expect(() =>
                    mapSquareOrder(
                        input(order, variations, { modifiers, containers }),
                    ),
                ).toThrow(ValidationException);
            });
        });

        describe('container_contents', () => {
            it('places one box with merged contents per unit of the line', () => {
                const result = planLines(
                    lineWith('box', 'VAR-BOX', '2', [
                        ['MOD-CHOC-1', '2'],
                        ['MOD-CHOC-2'],
                        ['MOD-OAT-1', '3'],
                        ['MOD-SHOT'],
                    ]),
                );
                expect(result.lines).toEqual([
                    {
                        squareLineUid: 'box',
                        menuItemId: 5,
                        menuItemSizeId: 50,
                        quantity: 2,
                        containerItems: [
                            { menuItemId: 3, menuItemSizeId: 30, quantity: 3 },
                            { menuItemId: 4, menuItemSizeId: 30, quantity: 3 },
                        ],
                    },
                ]);
                expect(result.unresolved).toEqual([]);
            });

            it.each([
                [
                    'under count',
                    [
                        ['MOD-CHOC-1', '2'],
                        ['MOD-OAT-1', '3'],
                    ],
                ],
                [
                    'over count',
                    [
                        ['MOD-CHOC-1', '4'],
                        ['MOD-OAT-1', '3'],
                    ],
                ],
                // Lemon scone isn't in the box's allowed list
                [
                    'a disallowed flavor',
                    [
                        ['MOD-CHOC-1', '3'],
                        ['MOD-LEMON', '3'],
                    ],
                ],
            ] as [string, [string, string][]][])(
                'makes a box %s container_invalid and keeps the other lines',
                (_label, mods) => {
                    const result = planLines(
                        lineWith('box', 'VAR-BOX', '1', mods),
                        line('pie', 'VAR-PIE'),
                    );
                    expect(result.lines.map((l) => l.squareLineUid)).toEqual([
                        'pie',
                    ]);
                    expect(reasons(result)).toEqual([
                        ['box', 'container_invalid'],
                    ]);
                },
            );

            it('checks the allowed list for the box size', () => {
                const result = planLines(
                    lineWith('box', 'VAR-BOX', '1', [['MOD-CHOC-1', '6']]),
                );
                expect(result.lines).toHaveLength(1);

                const otherSize = plan(
                    pickupOrder({
                        lineItems: [
                            lineWith('box', 'VAR-BOX', '1', [
                                ['MOD-CHOC-1', '6'],
                            ]),
                        ],
                    }),
                    { 'VAR-BOX': { ...box, menuItemSizeId: 51 } },
                    { modifiers, containers },
                );
                expect(reasons(otherSize)).toEqual([
                    ['box', 'container_invalid'],
                ]);
            });

            it('makes a box with an unmapped flavor unmapped_modifier', () => {
                const result = planLines(
                    lineWith('box', 'VAR-BOX', '1', [
                        ['MOD-CHOC-1', '5'],
                        ['MOD-UNMAPPED'],
                    ]),
                );
                expect(reasons(result)).toEqual([['box', 'unmapped_modifier']]);
            });

            it('makes the line container_invalid when the item is not a variable container', () => {
                const notVariable = plan(
                    pickupOrder({
                        lineItems: [
                            lineWith('box', 'VAR-BOX', '1', [
                                ['MOD-CHOC-1', '6'],
                            ]),
                        ],
                    }),
                    { 'VAR-BOX': { ...box, menuItemId: 7 } },
                    { modifiers, containers },
                );
                expect(reasons(notVariable)).toEqual([
                    ['box', 'container_invalid'],
                ]);
            });
        });

        describe('none', () => {
            it('expands a fixed container from its definition for that size', () => {
                const result = planLines(line('platter', 'VAR-PLATTER', '2'));
                expect(result.lines).toEqual([
                    {
                        squareLineUid: 'platter',
                        menuItemId: 7,
                        menuItemSizeId: 70,
                        quantity: 2,
                        containerItems: [
                            { menuItemId: 2, menuItemSizeId: 20, quantity: 3 },
                            { menuItemId: 4, menuItemSizeId: 30, quantity: 3 },
                        ],
                    },
                ]);
            });

            it('ignores modifiers, mapped or not', () => {
                const result = planLines(
                    lineWith('platter', 'VAR-PLATTER', '1', [['MOD-UNMAPPED']]),
                );
                expect(result.lines).toHaveLength(1);
                expect(result.unresolved).toEqual([]);
            });

            it('makes a variable container container_invalid instead of an empty box', () => {
                const result = plan(
                    pickupOrder({ lineItems: [line('box', 'VAR-BOX')] }),
                    { 'VAR-BOX': { ...box, modifierMode: 'none' } },
                    { modifiers, containers },
                );
                expect(reasons(result)).toEqual([['box', 'container_invalid']]);
            });
        });

        describe('ad-hoc mappings', () => {
            const planAdHoc = (
                adHocMappings: Record<string, SquareAdHocMapping>,
            ) => {
                const result = mapSquareOrder({
                    ...input(
                        pickupOrder({
                            lineItems: [{ uid: 'custom', quantity: '2' }],
                        }),
                        variations,
                        { modifiers, containers },
                    ),
                    adHocMappings: new Map(Object.entries(adHocMappings)),
                });
                if (result.kind !== 'plan') {
                    throw new Error('expected a plan');
                }
                return result.plan;
            };

            it("places an ad-hoc line with staff's mapping, by line uid", () => {
                expect(
                    planAdHoc({ custom: { menuItemId: 1, menuItemSizeId: 10 } })
                        .lines,
                ).toEqual([
                    {
                        squareLineUid: 'custom',
                        menuItemId: 1,
                        menuItemSizeId: 10,
                        quantity: 2,
                        containerItems: [],
                    },
                ]);
            });

            it('expands a fixed container it is mapped to', () => {
                const [platterLine] = planAdHoc({
                    custom: { menuItemId: 7, menuItemSizeId: 70 },
                }).lines;
                expect(platterLine.containerItems).toHaveLength(2);
            });

            it('leaves it unresolved without a mapping for its uid', () => {
                const result = planAdHoc({
                    other: { menuItemId: 1, menuItemSizeId: 10 },
                });
                expect(reasons(result)).toEqual([['custom', 'ad_hoc']]);
            });
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

describe('isSquareOrderCancelled', () => {
    const fulfillment = (
        type: Square.FulfillmentType,
        state: Square.FulfillmentState,
    ): Square.Fulfillment => ({ type, state });

    it('is true for a CANCELED order', () => {
        expect(isSquareOrderCancelled(pickupOrder({ state: 'CANCELED' }))).toBe(
            true,
        );
    });

    it('is true when every pickup or delivery fulfillment is cancelled or failed', () => {
        const order = pickupOrder({
            fulfillments: [
                fulfillment('PICKUP', 'CANCELED'),
                fulfillment('DELIVERY', 'FAILED'),
                // Not imported, so it doesn't keep the order alive
                fulfillment('SHIPMENT', 'PROPOSED'),
            ],
        });
        expect(isSquareOrderCancelled(order)).toBe(true);
        expect(mapSquareOrder(input(order))).toEqual({
            kind: 'skip',
            reason: 'cancelled',
        });
    });

    it('is false while one pickup or delivery fulfillment is live', () => {
        expect(
            isSquareOrderCancelled(
                pickupOrder({
                    fulfillments: [
                        fulfillment('PICKUP', 'CANCELED'),
                        fulfillment('PICKUP', 'RESERVED'),
                    ],
                }),
            ),
        ).toBe(false);
    });

    it.each(['PROPOSED', 'RESERVED', 'PREPARED', 'COMPLETED'] as const)(
        'ignores the progress state %s',
        (state) => {
            const order = pickupOrder();
            order.fulfillments![0].state = state;
            expect(isSquareOrderCancelled(order)).toBe(false);
            expect(plan(order)).toEqual(plan(pickupOrder()));
        },
    );

    it('is false without pickup or delivery fulfillments', () => {
        expect(
            isSquareOrderCancelled(pickupOrder({ fulfillments: undefined })),
        ).toBe(false);
    });

    it('reads the live fulfillment when another one was cancelled', () => {
        const cancelled: Square.Fulfillment = {
            type: 'PICKUP',
            state: 'CANCELED',
            pickupDetails: { recipient, pickupAt: '2026-11-01T15:00:00Z' },
        };
        const order = pickupOrder();
        order.fulfillments = [cancelled, ...order.fulfillments!];
        expect(plan(order).fields).toEqual(plan(pickupOrder()).fields);
    });
});

describe('squareRefundSummary', () => {
    it('is null without returns', () => {
        expect(squareRefundSummary(pickupOrder())).toBeNull();
        expect(squareRefundSummary(pickupOrder({ returns: [] }))).toBeNull();
    });

    it('summarizes returned lines and the returned amount', () => {
        const order = pickupOrder({
            returns: [
                {
                    uid: 'ret-2',
                    returnLineItems: [
                        {
                            uid: 'rl-1',
                            sourceLineItemUid: 'line-pie',
                            quantity: '1',
                            basePriceMoney: { amount: 1250n, currency: 'USD' },
                        },
                    ],
                },
                { uid: 'ret-1' },
            ],
            returnAmounts: {
                totalMoney: { amount: 1250n, currency: 'USD' },
            },
            tenders: [
                {
                    type: 'CARD',
                    cardDetails: { card: { last4: '4242' } },
                },
            ],
        });
        const summary = squareRefundSummary(order);
        expect(summary).toEqual({
            returnUids: ['ret-1', 'ret-2'],
            lines: [{ squareLineUid: 'line-pie', quantity: '1' }],
            returnedAmount: { amount: '1250', currency: 'USD' },
        });
        // bigint-free and no card data
        expect(JSON.stringify(summary)).not.toContain('4242');
    });
});
