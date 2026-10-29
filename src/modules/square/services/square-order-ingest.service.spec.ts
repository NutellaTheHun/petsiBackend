import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Square } from 'square';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { Location } from '../../locations/entities/location.entity';
import { LocationTestUtil } from '../../locations/utils/location-test.util';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { OrderController } from '../../orders/controllers/order.controller';
import { OrderCategory } from '../../orders/entities/order-category.entity';
import { Order } from '../../orders/entities/order.entity';
import { OrderService } from '../../orders/services/order.service';
import { orderToUpdateDto } from '../../orders/utils/entity-transformers/order.dto.transformer';
import { NestedCreateOrderMenuItemDto } from '../../orders/dto/order-menu-item/nested-create-order-menu-item.dto';
import { plainToInstance } from 'class-transformer';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { SquareConnection } from '../entities/square-connection.entity';
import { SquareLocationLink } from '../entities/square-location-link.entity';
import { SquareOrderLink } from '../entities/square-order-link.entity';
import { SquareUnresolvedLine } from '../entities/square-unresolved-line.entity';
import { SquareVariationLink } from '../entities/square-variation-link.entity';
import { SquareTestUtil } from '../utils/square-test.util';
import { getSquareTestingModule } from '../utils/square-testing.module';
import { SquareOrderIngestService } from './square-order-ingest.service';

const P = `t${Date.now()}`;

const SQ_LOCATION = `${P}-sq-loc`;
const SQ_LOCATION_DISABLED = `${P}-sq-loc-disabled`;
const SQ_LOCATION_UNMAPPED = `${P}-sq-loc-unmapped`;
const VAR_PIE = `${P}-var-pie`;
const VAR_CHERRY = `${P}-var-cherry`;
const VAR_UNMAPPED = `${P}-var-unmapped`;
const VAR_DISABLED = `${P}-var-disabled`;

// ─── Square fixtures (recipients fake, tenders stripped) ────────────────────

const pickup = (pickupAt = '2026-11-02T15:00:00Z'): Square.Fulfillment => ({
    type: 'PICKUP',
    state: 'PROPOSED',
    pickupDetails: {
        pickupAt,
        recipient: {
            displayName: 'Jane Doe',
            phoneNumber: '555-0100',
            emailAddress: 'jane@example.com',
        },
    },
});

const line = (
    uid: string,
    catalogObjectId: string | undefined,
    quantity = '1',
    name = 'Item',
): Square.OrderLineItem => ({
    uid,
    name,
    quantity,
    catalogObjectId,
    basePriceMoney: { amount: 1250n, currency: 'USD' },
});

let orderSeq = 0;
const newOrderId = () => `${P}-order-${++orderSeq}`;

const squareOrder = (overrides: Partial<Square.Order>): Square.Order => ({
    id: newOrderId(),
    locationId: SQ_LOCATION,
    state: 'OPEN',
    version: 1,
    fulfillments: [pickup()],
    lineItems: [line('l-pie', VAR_PIE, '2', 'Apple Pie')],
    totalMoney: { amount: 2500n, currency: 'USD' },
    ...overrides,
});

describe('SquareOrderIngestService', () => {
    let module: TestingModule;
    let ingestService: SquareOrderIngestService;
    let orderService: OrderService;
    let orderController: OrderController;
    let requestContext: TestRequestContextService;
    let orderRepo: Repository<Order>;
    let orderLinkRepo: Repository<SquareOrderLink>;
    let unresolvedRepo: Repository<SquareUnresolvedLine>;
    let locationLinkRepo: Repository<SquareLocationLink>;
    let variationRepo: Repository<SquareVariationLink>;
    let connectionRepo: Repository<SquareConnection>;
    let categoryRepo: Repository<OrderCategory>;
    let menuItemRepo: Repository<MenuItem>;
    let sizeRepo: Repository<MenuItemSize>;
    let locationRepo: Repository<Location>;
    let tenantRepo: Repository<Tenant>;
    let testCtx: DatabaseTestContext;

    let tenant: Tenant;
    let location: Location;
    let squareCategory: OrderCategory;
    let otherCategory: OrderCategory;
    let connection: SquareConnection;
    let large: MenuItemSize;
    let applePie: MenuItem;
    let cherryPie: MenuItem;
    let scone: MenuItem;

    /** Staff and controller calls run as a tenant admin. */
    const asStaff = <T>(fn: () => Promise<T>) =>
        requestContext.runWithContext(
            { tenantId: tenant.id, isTenantAdmin: true },
            fn,
        );

    const loadOrder = (id: number) =>
        orderRepo.findOneOrFail({
            where: { id },
            relations: [
                'category',
                'orderedItems',
                'orderedItems.menuItem',
                'orderedItems.size',
                'orderedItems.containerOrderMenuItems',
            ],
        });

    const linkFor = (squareOrderId: string) =>
        orderLinkRepo.findOne({
            where: { tenantId: tenant.id, squareOrderId },
        });

    const linesFor = (squareOrderId: string) =>
        unresolvedRepo.find({
            where: { tenantId: tenant.id, squareOrderId },
            order: { squareLineUid: 'ASC' },
        });

    const items = (order: Order) =>
        order.orderedItems
            .map((item) => ({
                menuItemId: item.menuItem.id,
                quantity: item.quantity,
            }))
            .sort((a, b) => a.menuItemId - b.menuItemId);

    beforeAll(async () => {
        module = await getSquareTestingModule();
        ingestService = module.get(SquareOrderIngestService);
        orderService = module.get(OrderService);
        orderController = module.get(OrderController);
        requestContext = module.get(RequestContextService);
        orderRepo = module.get(getRepositoryToken(Order));
        orderLinkRepo = module.get(getRepositoryToken(SquareOrderLink));
        unresolvedRepo = module.get(getRepositoryToken(SquareUnresolvedLine));
        locationLinkRepo = module.get(getRepositoryToken(SquareLocationLink));
        variationRepo = module.get(getRepositoryToken(SquareVariationLink));
        connectionRepo = module.get(getRepositoryToken(SquareConnection));
        categoryRepo = module.get(getRepositoryToken(OrderCategory));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
        locationRepo = module.get(getRepositoryToken(Location));
        tenantRepo = module.get(getRepositoryToken(Tenant));

        const locationUtil = module.get(LocationTestUtil);
        tenant = await locationUtil.seedTenant(P);
        ({
            locations: [location],
        } = await locationUtil.seedLocations(P, tenant, 1));
        [squareCategory, otherCategory] = await categoryRepo.save([
            { tenantId: tenant.id, name: `${P} Square` },
            { tenantId: tenant.id, name: `${P} Catering` },
        ]);
        large = await sizeRepo.save({
            tenantId: tenant.id,
            name: `${P} Large`,
        });
        [applePie, cherryPie, scone] = await menuItemRepo.save(
            [`${P} Apple Pie`, `${P} Cherry Pie`, `${P} Scone`].map((name) =>
                menuItemRepo.create({
                    tenantId: tenant.id,
                    name,
                    type: MENU_ITEM_TYPES.SINGLE,
                    sizes: [large],
                }),
            ),
        );

        connection = await module
            .get(SquareTestUtil)
            .seedConnection(P, tenant.id, {
                defaultOrderCategoryId: squareCategory.id,
            });
        await locationLinkRepo.save([
            {
                tenantId: tenant.id,
                squareLocationId: SQ_LOCATION,
                squareName: `${P} Main`,
                timezone: 'America/New_York',
                enabled: true,
                locationId: location.id,
            },
            {
                tenantId: tenant.id,
                squareLocationId: SQ_LOCATION_DISABLED,
                squareName: `${P} Disabled`,
                enabled: false,
                locationId: location.id,
            },
            {
                tenantId: tenant.id,
                squareLocationId: SQ_LOCATION_UNMAPPED,
                squareName: `${P} Unmapped`,
                enabled: true,
                locationId: null,
            },
        ]);
        const variation = (
            squareVariationId: string,
            mapping: Partial<SquareVariationLink>,
        ) =>
            variationRepo.create({
                tenantId: tenant.id,
                squareVariationId,
                squareItemId: `${squareVariationId}-item`,
                squareItemName: squareVariationId,
                squareVariationName: 'Large',
                menuItemSizeId: large.id,
                ...mapping,
            });
        await variationRepo.save([
            variation(VAR_PIE, { menuItemId: applePie.id }),
            variation(VAR_CHERRY, { menuItemId: cherryPie.id }),
            variation(VAR_UNMAPPED, { menuItemId: null, menuItemSizeId: null }),
            variation(VAR_DISABLED, { menuItemId: scone.id, enabled: false }),
        ]);
    });

    afterAll(async () => {
        await variationRepo.delete({ tenantId: tenant.id });
        await locationLinkRepo.delete({ tenantId: tenant.id });
        await connectionRepo.delete({ tenantId: tenant.id });
        await menuItemRepo.delete({ tenantId: tenant.id });
        await sizeRepo.delete({ tenantId: tenant.id });
        await categoryRepo.delete({ tenantId: tenant.id });
        await locationRepo.delete({ id: location.id });
        await tenantRepo.delete(tenant.id);
        await module.close();
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
        // Ingest runs without a request context (webhooks, import)
        requestContext.setContext({
            tenantId: undefined,
            isTenantAdmin: undefined,
            userId: undefined,
            locations: undefined,
        });
        testCtx.addCleanupFunction(async () => {
            await unresolvedRepo.delete({ tenantId: tenant.id });
            await orderLinkRepo.delete({ tenantId: tenant.id });
            await orderRepo.delete({ tenantId: tenant.id });
        });
    });

    afterEach(async () => {
        jest.restoreAllMocks();
        await testCtx.executeCleanupFunctions();
    });

    describe('scope', () => {
        it.each([
            ['an in-store order', { fulfillments: [{ type: 'IN_STORE' }] }],
            ['an order without fulfillments', { fulfillments: undefined }],
            ['a draft', { state: 'DRAFT' }],
            ['a disabled location', { locationId: SQ_LOCATION_DISABLED }],
            ['an unmapped location', { locationId: SQ_LOCATION_UNMAPPED }],
            ['an unknown location', { locationId: `${P}-sq-loc-unknown` }],
        ] as [string, Partial<Square.Order>][])(
            'creates nothing for %s',
            async (_label, overrides) => {
                const order = squareOrder(overrides);
                const result = await ingestService.ingest(connection, order);

                expect(result.outcome).toBe('skipped');
                expect(await linkFor(order.id!)).toBeNull();
                expect(await linesFor(order.id!)).toEqual([]);
                expect(
                    await orderRepo.count({ where: { tenantId: tenant.id } }),
                ).toBe(0);
            },
        );

        it('imports a draft once it is sent as open', async () => {
            const draft = squareOrder({ state: 'DRAFT', version: 1 });
            await ingestService.ingest(connection, draft);
            expect(await linkFor(draft.id!)).toBeNull();

            const result = await ingestService.ingest(connection, {
                ...draft,
                state: 'OPEN',
                version: 2,
            });

            expect(result.outcome).toBe('created');
            const link = await linkFor(draft.id!);
            expect(link?.squareVersion).toBe('2');
        });

        it('imports a completed order like an open one', async () => {
            const order = squareOrder({ state: 'COMPLETED' });
            const result = await ingestService.ingest(connection, order);

            expect(result.outcome).toBe('created');
            expect((await linkFor(order.id!))?.status).toBe('linked');
        });
    });

    describe('create', () => {
        it('imports the Square fields, the default category and the lines', async () => {
            const order = squareOrder({
                fulfillments: [pickup('2026-11-02T15:00:00Z')],
                lineItems: [
                    line('l-pie', VAR_PIE, '2'),
                    line('l-cherry', VAR_CHERRY, '1'),
                ],
            });
            const result = await ingestService.ingest(connection, order);
            if (result.outcome !== 'created') throw new Error(result.outcome);

            const petsiOrder = await loadOrder(result.orderId);
            expect(petsiOrder).toMatchObject({
                tenantId: tenant.id,
                locationId: location.id,
                recipient: 'Jane Doe',
                phoneNumber: '555-0100',
                email: 'jane@example.com',
                fulfillmentType: 'pickup',
                deliveryAddress: null,
                isFrozen: false,
                status: 'ACTIVE',
                category: { id: squareCategory.id },
            });
            expect(petsiOrder.fulfillmentDate.toISOString()).toBe(
                '2026-11-02T15:00:00.000Z',
            );
            expect(items(petsiOrder)).toEqual([
                { menuItemId: applePie.id, quantity: 2 },
                { menuItemId: cherryPie.id, quantity: 1 },
            ]);

            const link = await linkFor(order.id!);
            const idOf = (menuItemId: number) =>
                petsiOrder.orderedItems.find(
                    (item) => item.menuItem.id === menuItemId,
                )!.id;
            expect(link).toMatchObject({
                orderId: petsiOrder.id,
                squareLocationId: SQ_LOCATION,
                squareVersion: '1',
                lineMap: {
                    'l-pie': [idOf(applePie.id)],
                    'l-cherry': [idOf(cherryPie.id)],
                },
            });
        });

        it('imports a delivery order with the joined address', async () => {
            const order = squareOrder({
                fulfillments: [
                    {
                        type: 'DELIVERY',
                        deliveryDetails: {
                            deliverAt: '2026-11-03T15:00:00Z',
                            recipient: {
                                displayName: 'Jane Doe',
                                phoneNumber: '555-0100',
                                address: {
                                    addressLine1: '12 Main St',
                                    locality: 'Springfield',
                                    postalCode: '01101',
                                },
                            },
                        },
                    },
                ],
            });
            const result = await ingestService.ingest(connection, order);
            if (result.outcome !== 'created') throw new Error(result.outcome);

            expect(await loadOrder(result.orderId)).toMatchObject({
                fulfillmentType: 'delivery',
                deliveryAddress: '12 Main St, Springfield, 01101',
            });
        });

        it('turns unmapped and ad-hoc lines into pending lines and imports the rest', async () => {
            const order = squareOrder({
                lineItems: [
                    line('l-pie', VAR_PIE, '2'),
                    line('l-new', VAR_UNMAPPED, '3', 'Seasonal Pie'),
                    {
                        ...line('l-adhoc', undefined, '1', 'Custom'),
                        note: 'blue',
                    },
                ],
            });
            const result = await ingestService.ingest(connection, order);
            if (result.outcome !== 'created') throw new Error(result.outcome);

            expect(items(await loadOrder(result.orderId))).toEqual([
                { menuItemId: applePie.id, quantity: 2 },
            ]);
            expect(await linesFor(order.id!)).toMatchObject([
                {
                    squareLineUid: 'l-adhoc',
                    squareVariationId: null,
                    reason: 'ad_hoc',
                    quantity: 1,
                    note: 'blue',
                    status: 'pending',
                    orderId: result.orderId,
                    locationId: location.id,
                },
                {
                    squareLineUid: 'l-new',
                    squareVariationId: VAR_UNMAPPED,
                    squareItemName: 'Seasonal Pie',
                    reason: 'unmapped_variation',
                    quantity: 3,
                    status: 'pending',
                },
            ]);
        });

        it('leaves no order item and no unresolved line for a disabled variation', async () => {
            const order = squareOrder({
                lineItems: [
                    line('l-pie', VAR_PIE),
                    line('l-scone', VAR_DISABLED),
                ],
            });
            const result = await ingestService.ingest(connection, order);
            if (result.outcome !== 'created') throw new Error(result.outcome);

            expect(items(await loadOrder(result.orderId))).toEqual([
                { menuItemId: applePie.id, quantity: 1 },
            ]);
            expect(await linesFor(order.id!)).toEqual([]);
        });

        it('creates without a category when the connection has no default', async () => {
            const order = squareOrder({});
            const result = await ingestService.ingest(
                { ...connection, defaultOrderCategoryId: null },
                order,
            );
            if (result.outcome !== 'created') throw new Error(result.outcome);

            expect((await loadOrder(result.orderId)).category).toBeNull();
        });
    });

    describe('order lifecycle across Square updates', () => {
        const squareOrderId = `${P}-lifecycle`;
        let orderId: number;

        // These tests share one order; cleanup runs at the end of the chain.
        beforeEach(() => {
            testCtx = new DatabaseTestContext();
        });

        afterAll(async () => {
            await unresolvedRepo.delete({ tenantId: tenant.id });
            await orderLinkRepo.delete({ tenantId: tenant.id });
            await orderRepo.delete({ tenantId: tenant.id });
        });

        it('imports version 1', async () => {
            const result = await ingestService.ingest(
                connection,
                squareOrder({
                    id: squareOrderId,
                    version: 1,
                    lineItems: [
                        line('l-pie', VAR_PIE, '1'),
                        line('l-cherry', VAR_CHERRY, '1'),
                        line('l-new', VAR_UNMAPPED, '1'),
                    ],
                }),
            );
            if (result.outcome !== 'created') throw new Error(result.outcome);
            orderId = result.orderId;
        });

        it('keeps staff edits: an added line and a changed category', async () => {
            await asStaff(async () => {
                const order = await loadOrder(orderId);
                await orderService.update(
                    orderId,
                    orderToUpdateDto(order, {
                        categoryId: otherCategory.id,
                        orderedItems: [
                            plainToInstance(NestedCreateOrderMenuItemDto, {
                                createId: 'staff',
                                menuItemId: scone.id,
                                sizeId: large.id,
                                quantity: 4,
                            }),
                        ],
                    }),
                );
            });
            expect(items(await loadOrder(orderId))).toHaveLength(3);
        });

        it('applies version 2: changed, removed and added Square lines', async () => {
            const result = await ingestService.ingest(
                connection,
                squareOrder({
                    id: squareOrderId,
                    version: 2,
                    fulfillments: [pickup('2026-11-04T15:00:00Z')],
                    lineItems: [
                        line('l-pie', VAR_PIE, '5'),
                        line('l-new', VAR_UNMAPPED, '2'),
                        line('l-adhoc', undefined, '1'),
                    ],
                }),
            );
            expect(result).toEqual({ outcome: 'updated', orderId });

            const order = await loadOrder(orderId);
            expect(items(order)).toEqual(
                [
                    { menuItemId: applePie.id, quantity: 5 },
                    { menuItemId: scone.id, quantity: 4 },
                ].sort((a, b) => a.menuItemId - b.menuItemId),
            );
            expect(order.fulfillmentDate.toISOString()).toBe(
                '2026-11-04T15:00:00.000Z',
            );
            // category is Petsi-owned after create
            expect(order.category?.id).toBe(otherCategory.id);

            const link = await linkFor(squareOrderId);
            const pieItem = order.orderedItems.find(
                (item) => item.menuItem.id === applePie.id,
            )!;
            expect(link?.squareVersion).toBe('2');
            expect(link?.lineMap).toEqual({ 'l-pie': [pieItem.id] });

            const lines = await linesFor(squareOrderId);
            expect(
                lines.map((l) => [l.squareLineUid, l.quantity, l.status]),
            ).toEqual([
                ['l-adhoc', 1, 'pending'],
                ['l-new', 2, 'pending'],
            ]);
        });

        it('ignores a repeated or older version', async () => {
            const updateSpy = jest.spyOn(orderService, 'update');
            const before = await loadOrder(orderId);

            for (const version of [2, 1]) {
                const result = await ingestService.ingest(
                    connection,
                    squareOrder({
                        id: squareOrderId,
                        version,
                        lineItems: [line('l-cherry', VAR_CHERRY, '9')],
                    }),
                );
                expect(result).toEqual({ outcome: 'stale' });
            }

            expect(updateSpy).not.toHaveBeenCalled();
            expect(items(await loadOrder(orderId))).toEqual(items(before));
            expect((await linkFor(squareOrderId))?.squareVersion).toBe('2');
            expect(await linesFor(squareOrderId)).toHaveLength(2);
        });

        it('resolves a pending line once its variation is placed', async () => {
            await variationRepo.update(
                { tenantId: tenant.id, squareVariationId: VAR_UNMAPPED },
                { menuItemId: cherryPie.id, menuItemSizeId: large.id },
            );
            try {
                await ingestService.ingest(
                    connection,
                    squareOrder({
                        id: squareOrderId,
                        version: 3,
                        lineItems: [
                            line('l-pie', VAR_PIE, '5'),
                            line('l-new', VAR_UNMAPPED, '2'),
                        ],
                    }),
                );
            } finally {
                await variationRepo.update(
                    { tenantId: tenant.id, squareVariationId: VAR_UNMAPPED },
                    { menuItemId: null, menuItemSizeId: null },
                );
            }

            expect(items(await loadOrder(orderId))).toContainEqual({
                menuItemId: cherryPie.id,
                quantity: 2,
            });
            // l-new now placed → resolved; l-adhoc gone from Square → removed
            expect(
                (await linesFor(squareOrderId)).map((l) => [
                    l.squareLineUid,
                    l.status,
                ]),
            ).toEqual([['l-new', 'resolved']]);
        });
    });

    describe('order responses', () => {
        it('carry pending lines and both flags', async () => {
            const order = squareOrder({
                lineItems: [
                    line('l-pie', VAR_PIE),
                    line('l-new', VAR_UNMAPPED, '2', 'Seasonal Pie'),
                ],
            });
            const result = await ingestService.ingest(connection, order);
            if (result.outcome !== 'created') throw new Error(result.outcome);

            const response = await asStaff(() =>
                orderController.findOneOrderResponse(result.orderId),
            );
            expect(response).toMatchObject({
                squareLinked: true,
                hasUnresolvedSquareLines: true,
                unresolvedSquareLines: [
                    {
                        squareLineUid: 'l-new',
                        squareVariationId: VAR_UNMAPPED,
                        squareItemName: 'Seasonal Pie',
                        reason: 'unmapped_variation',
                        quantity: 2,
                    },
                ],
            });

            const list = await asStaff(() =>
                orderController.findAllOrderResponses(
                    undefined,
                    100,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    [`category=${squareCategory.id}`],
                ),
            );
            expect(
                list.items.find((item) => item.id === result.orderId),
            ).toMatchObject({
                squareLinked: true,
                hasUnresolvedSquareLines: true,
            });
        });

        it('are false and empty for an order not from Square', async () => {
            const created = await asStaff(() =>
                orderService.create({
                    recipient: `${P} walk-in`,
                    fulfillmentDate: new Date('2026-11-05T15:00:00Z'),
                    fulfillmentType: 'pickup',
                    categoryId: otherCategory.id,
                    locationId: location.id,
                    orderedItems: [],
                }),
            );

            const response = await asStaff(() =>
                orderController.findOneOrderResponse(created.id),
            );
            expect(response).toMatchObject({
                squareLinked: false,
                hasUnresolvedSquareLines: false,
                unresolvedSquareLines: [],
            });
        });
    });
});
