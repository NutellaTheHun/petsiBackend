import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Square } from 'square';
import { Repository } from 'typeorm';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
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
import { ORDER_STATUSES } from '../../orders/utils/order-statuses';
import { OrderMenuItemService } from '../../orders/services/order-menu-item.service';
import { UpdateOrderDto } from '../../orders/dto/order/update-order.dto';
import { orderMenuItemToNestedUpdateDto } from '../../orders/utils/entity-transformers/order-menu-item.dto.transformer';
import { orderToUpdateDto } from '../../orders/utils/entity-transformers/order.dto.transformer';
import { NestedCreateOrderMenuItemDto } from '../../orders/dto/order-menu-item/nested-create-order-menu-item.dto';
import { plainToInstance } from 'class-transformer';
import { RequestContextService } from '../../request-context/RequestContextService';
import { RevisionHistoryService } from '../../revision-history/revision-history.service';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { SquareConnection } from '../entities/square-connection.entity';
import { SquareLocationLink } from '../entities/square-location-link.entity';
import { SquareModifierLink } from '../entities/square-modifier-link.entity';
import { SquareOrderIssue } from '../entities/square-order-issue.entity';
import { SquareOrderLink } from '../entities/square-order-link.entity';
import { SquareUnresolvedLine } from '../entities/square-unresolved-line.entity';
import { SquareVariationLink } from '../entities/square-variation-link.entity';
import { SquareTestUtil } from '../utils/square-test.util';
import { getSquareTestingModule } from '../utils/square-testing.module';
import { SquareOrderDetachService } from './square-order-detach.service';
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
    let orderMenuItemService: OrderMenuItemService;
    let detachService: SquareOrderDetachService;
    let orderController: OrderController;
    let requestContext: TestRequestContextService;
    let orderRepo: Repository<Order>;
    let orderLinkRepo: Repository<SquareOrderLink>;
    let unresolvedRepo: Repository<SquareUnresolvedLine>;
    let issueRepo: Repository<SquareOrderIssue>;
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
        orderMenuItemService = module.get(OrderMenuItemService);
        detachService = module.get(SquareOrderDetachService);
        orderController = module.get(OrderController);
        requestContext = module.get(RequestContextService);
        orderRepo = module.get(getRepositoryToken(Order));
        orderLinkRepo = module.get(getRepositoryToken(SquareOrderLink));
        unresolvedRepo = module.get(getRepositoryToken(SquareUnresolvedLine));
        issueRepo = module.get(getRepositoryToken(SquareOrderIssue));
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
            await issueRepo.delete({ tenantId: tenant.id });
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
            await issueRepo.delete({ tenantId: tenant.id });
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

    describe('ownership and detach', () => {
        const squareOrderId = `${P}-owned`;
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

        const pieItemOf = (order: Order) =>
            order.orderedItems.find(
                (item) => item.menuItem.id === applePie.id,
            )!;

        /** The staff update's validation error tree. */
        const rejectedUpdate = async (dto: UpdateOrderDto) => {
            const err: unknown = await asStaff(() =>
                orderService.update(orderId, dto),
            ).catch((e: unknown) => e);
            expect(err).toBeInstanceOf(ValidationException);
            return (err as ValidationException).errors;
        };

        it('imports the order', async () => {
            const result = await ingestService.ingest(
                connection,
                squareOrder({
                    id: squareOrderId,
                    version: 1,
                    lineItems: [
                        line('l-pie', VAR_PIE, '2'),
                        line('l-new', VAR_UNMAPPED, '1'),
                    ],
                }),
            );
            if (result.outcome !== 'created') throw new Error(result.outcome);
            orderId = result.orderId;
        });

        it('rejects staff edits to Square-owned fields and lines', async () => {
            const before = await loadOrder(orderId);
            const pie = pieItemOf(before);

            expectValidationErrorPayload(
                await rejectedUpdate(
                    orderToUpdateDto(before, {
                        recipient: 'Someone Else',
                        phoneNumber: '555-9999',
                    }),
                ),
                [],
                createValidationErrorPayload('IMMUTABLE_FIELD', undefined, [
                    'recipient',
                    'phoneNumber',
                ]),
            );
            expectValidationErrorPayload(
                await rejectedUpdate(
                    plainToInstance(UpdateOrderDto, { orderedItems: [] }),
                ),
                [],
                createValidationErrorPayload(
                    'IMMUTABLE_FIELD',
                    [pie.id],
                    ['orderedItems'],
                ),
            );
            expectValidationErrorPayload(
                await rejectedUpdate(
                    plainToInstance(UpdateOrderDto, {
                        orderedItems: [
                            orderMenuItemToNestedUpdateDto(pie, {
                                quantity: 7,
                            }),
                        ],
                    }),
                ),
                [{ prop: 'orderedItems', id: pie.id }],
                createValidationErrorPayload('IMMUTABLE_FIELD', undefined, [
                    'quantity',
                ]),
            );
            // Nor through the line route or a revert
            await expect(
                asStaff(() => orderMenuItemService.remove(pie.id)),
            ).rejects.toBeInstanceOf(ValidationException);
            await expect(
                asStaff(() => orderService.revertToRevision(orderId, 1)),
            ).rejects.toBeInstanceOf(ValidationException);

            const after = await loadOrder(orderId);
            expect(after.recipient).toBe('Jane Doe');
            expect(items(after)).toEqual(items(before));
        });

        it('accepts Petsi-owned edits: category, freeze, note and a staff line', async () => {
            await asStaff(async () => {
                await orderService.update(
                    orderId,
                    orderToUpdateDto(await loadOrder(orderId), {
                        categoryId: otherCategory.id,
                        isFrozen: true,
                        note: 'internal note',
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
                await orderService.update(
                    orderId,
                    orderToUpdateDto(await loadOrder(orderId), {
                        isFrozen: false,
                    }),
                );
            });
            const order = await loadOrder(orderId);
            expect(order.category?.id).toBe(otherCategory.id);
            expect(order.note).toBe('internal note');
            expect(order.isFrozen).toBe(false);
            expect(items(order)).toContainEqual({
                menuItemId: scone.id,
                quantity: 4,
            });
        });

        it('keeps staff lines and Petsi fields across a Square update', async () => {
            const result = await ingestService.ingest(
                connection,
                squareOrder({
                    id: squareOrderId,
                    version: 2,
                    fulfillments: [pickup('2026-11-05T15:00:00Z')],
                    lineItems: [
                        line('l-pie', VAR_PIE, '3'),
                        line('l-new', VAR_UNMAPPED, '1'),
                    ],
                }),
            );
            expect(result).toEqual({ outcome: 'updated', orderId });

            const order = await loadOrder(orderId);
            expect(items(order)).toEqual(
                [
                    { menuItemId: applePie.id, quantity: 3 },
                    { menuItemId: scone.id, quantity: 4 },
                ].sort((a, b) => a.menuItemId - b.menuItemId),
            );
            expect(order.fulfillmentDate.toISOString()).toBe(
                '2026-11-05T15:00:00.000Z',
            );
            expect(order.category?.id).toBe(otherCategory.id);
            expect(order.note).toBe('internal note');
        });

        it('404s a detach from another location', async () => {
            await expect(
                asStaff(() =>
                    detachService.detachForCurrentTenant(9_999_999, orderId),
                ),
            ).rejects.toBeInstanceOf(NotFoundException);
            expect((await linkFor(squareOrderId))?.status).toBe('linked');
        });

        it('detach dismisses pending lines and unlocks the order', async () => {
            await asStaff(() =>
                detachService.detachForCurrentTenant(location.id, orderId),
            );

            const link = await linkFor(squareOrderId);
            expect(link?.status).toBe('detached');
            expect(link?.lineMap).toEqual({});
            expect(
                (await linesFor(squareOrderId)).map((l) => [
                    l.squareLineUid,
                    l.status,
                ]),
            ).toEqual([['l-new', 'dismissed']]);

            // Square-owned fields and lines are now editable
            const before = await loadOrder(orderId);
            const pie = pieItemOf(before);
            await asStaff(() =>
                orderService.update(
                    orderId,
                    plainToInstance(UpdateOrderDto, {
                        recipient: 'Phone Change',
                        orderedItems: before.orderedItems
                            .filter((item) => item.id !== pie.id)
                            .map((item) =>
                                orderMenuItemToNestedUpdateDto(item),
                            ),
                    }),
                ),
            );
            const after = await loadOrder(orderId);
            expect(after.recipient).toBe('Phone Change');
            expect(items(after)).toEqual([
                { menuItemId: scone.id, quantity: 4 },
            ]);
        });

        it('ignores later Square updates', async () => {
            const updateSpy = jest.spyOn(orderService, 'update');
            const result = await ingestService.ingest(
                connection,
                squareOrder({
                    id: squareOrderId,
                    version: 3,
                    lineItems: [
                        line('l-pie', VAR_PIE, '9'),
                        line('l-adhoc', undefined, '1'),
                    ],
                }),
            );
            expect(result).toEqual({ outcome: 'skipped', reason: 'detached' });
            expect(updateSpy).not.toHaveBeenCalled();

            const order = await loadOrder(orderId);
            expect(order.recipient).toBe('Phone Change');
            expect(items(order)).toEqual([
                { menuItemId: scone.id, quantity: 4 },
            ]);
            expect(
                (await linesFor(squareOrderId)).map((l) => l.squareLineUid),
            ).toEqual(['l-new']);
            expect((await linkFor(squareOrderId))?.squareVersion).toBe('2');
        });

        it('detaching again is a no-op', async () => {
            await asStaff(() =>
                detachService.detachForCurrentTenant(location.id, orderId),
            );
            expect((await linkFor(squareOrderId))?.status).toBe('detached');
        });
    });

    describe('boxes and modifier modes', () => {
        const VAR_BOX = `${P}-var-box`;
        const VAR_SCONE = `${P}-var-scone`;
        const VAR_PLATTER = `${P}-var-platter`;
        const MOD_CHOC_1 = `${P}-mod-choc-1`;
        const MOD_CHOC_2 = `${P}-mod-choc-2`;
        const MOD_OAT = `${P}-mod-oat`;
        const MOD_LEMON = `${P}-mod-lemon`;
        const MOD_SHOT = `${P}-mod-shot`;
        const MOD_UNMAPPED = `${P}-mod-unmapped`;

        let modifierRepo: Repository<SquareModifierLink>;
        let each: MenuItemSize;
        let boxSize: MenuItemSize;
        let platterSize: MenuItemSize;
        let chocChip: MenuItem;
        let oatmeal: MenuItem;
        let lemonScone: MenuItem;
        let boxOf6: MenuItem;
        let platter: MenuItem;

        const withModifiers = (
            uid: string,
            catalogObjectId: string,
            quantity: string,
            mods: [string, string?][],
        ): Square.OrderLineItem => ({
            ...line(uid, catalogObjectId, quantity),
            modifiers: mods.map(([id, modQuantity], i) => ({
                uid: `${uid}-m${i}`,
                catalogObjectId: id,
                name: id,
                quantity: modQuantity ?? '1',
            })),
        });

        const loadWithContents = (id: number) =>
            orderRepo.findOneOrFail({
                where: { id },
                relations: [
                    'orderedItems',
                    'orderedItems.menuItem',
                    'orderedItems.containerOrderMenuItems',
                    'orderedItems.containerOrderMenuItems.containedMenuItem',
                ],
            });

        const contentsOf = (order: Order, menuItemId: number) =>
            order.orderedItems
                .find((item) => item.menuItem.id === menuItemId)!
                .containerOrderMenuItems!.map((c) => ({
                    menuItemId: c.containedMenuItem.id,
                    quantity: c.quantity,
                }))
                .sort((a, b) => a.menuItemId - b.menuItemId);

        const singles = (names: string[]) =>
            menuItemRepo.save(
                names.map((name) =>
                    menuItemRepo.create({
                        tenantId: tenant.id,
                        name: `${P} ${name}`,
                        type: MENU_ITEM_TYPES.SINGLE,
                        sizes: [each],
                    }),
                ),
            );

        const contents = (
            parentSize: MenuItemSize,
            entries: [MenuItem, number][],
        ) =>
            entries.map(([item, quantity]) => ({
                tenantId: tenant.id,
                parentItemSize: parentSize,
                containedMenuItem: item,
                containedItemSize: each,
                quantity,
            }));

        beforeAll(async () => {
            modifierRepo = module.get(getRepositoryToken(SquareModifierLink));
            [each, boxSize, platterSize] = await sizeRepo.save(
                ['Each', 'Box', 'Platter'].map((name) => ({
                    tenantId: tenant.id,
                    name: `${P} ${name}`,
                })),
            );
            [chocChip, oatmeal, lemonScone] = await singles([
                'Chocolate Chip',
                'Oatmeal',
                'Lemon Scone',
            ]);
            [boxOf6, platter] = await menuItemRepo.save([
                menuItemRepo.create({
                    tenantId: tenant.id,
                    name: `${P} Box of 6 Cookies`,
                    type: MENU_ITEM_TYPES.CONTAINER,
                    variableMaxAmount: 6,
                    sizes: [boxSize],
                    containerMenuItems: contents(boxSize, [
                        [chocChip, 1],
                        [oatmeal, 1],
                    ]),
                }),
                menuItemRepo.create({
                    tenantId: tenant.id,
                    name: `${P} Pastry Platter`,
                    type: MENU_ITEM_TYPES.CONTAINER,
                    variableMaxAmount: null,
                    sizes: [platterSize],
                    containerMenuItems: contents(platterSize, [
                        [chocChip, 3],
                        [lemonScone, 2],
                    ]),
                }),
            ]);

            await variationRepo.save(
                [
                    {
                        squareVariationId: VAR_BOX,
                        menuItemId: boxOf6.id,
                        menuItemSizeId: boxSize.id,
                        modifierMode: 'container_contents' as const,
                    },
                    {
                        squareVariationId: VAR_SCONE,
                        menuItemId: null,
                        menuItemSizeId: null,
                        modifierMode: 'modifier_is_item' as const,
                    },
                    {
                        squareVariationId: VAR_PLATTER,
                        menuItemId: platter.id,
                        menuItemSizeId: platterSize.id,
                    },
                ].map((mapping) =>
                    variationRepo.create({
                        tenantId: tenant.id,
                        squareItemId: `${mapping.squareVariationId}-item`,
                        squareItemName: mapping.squareVariationId,
                        squareVariationName: '',
                        ...mapping,
                    }),
                ),
            );

            const modifier = (
                squareModifierId: string,
                mapping: Partial<SquareModifierLink>,
            ) =>
                modifierRepo.create({
                    tenantId: tenant.id,
                    squareModifierId,
                    squareModifierListId: `${squareModifierId}-list`,
                    squareModifierListName: 'Flavor',
                    squareModifierName: squareModifierId,
                    menuItemSizeId: each.id,
                    ...mapping,
                });
            await modifierRepo.save([
                modifier(MOD_CHOC_1, { menuItemId: chocChip.id }),
                modifier(MOD_CHOC_2, { menuItemId: chocChip.id }),
                modifier(MOD_OAT, { menuItemId: oatmeal.id }),
                modifier(MOD_LEMON, { menuItemId: lemonScone.id }),
                modifier(MOD_SHOT, {
                    kind: 'ignore',
                    menuItemId: null,
                    menuItemSizeId: null,
                }),
                modifier(MOD_UNMAPPED, {
                    menuItemId: null,
                    menuItemSizeId: null,
                }),
            ]);
        });

        afterAll(async () => {
            await modifierRepo.delete({ tenantId: tenant.id });
        });

        it('imports a valid box as one container item with merged counts', async () => {
            const order = squareOrder({
                lineItems: [
                    withModifiers('l-box', VAR_BOX, '2', [
                        [MOD_CHOC_1, '2'],
                        [MOD_CHOC_2],
                        [MOD_OAT, '3'],
                        [MOD_SHOT],
                    ]),
                ],
            });
            const result = await ingestService.ingest(connection, order);
            if (result.outcome !== 'created') throw new Error(result.outcome);

            const petsiOrder = await loadWithContents(result.orderId);
            expect(items(petsiOrder)).toEqual([
                { menuItemId: boxOf6.id, quantity: 2 },
            ]);
            expect(contentsOf(petsiOrder, boxOf6.id)).toEqual([
                { menuItemId: chocChip.id, quantity: 3 },
                { menuItemId: oatmeal.id, quantity: 3 },
            ]);
            expect(await linesFor(order.id!)).toEqual([]);
            expect((await linkFor(order.id!))?.lineMap).toEqual({
                'l-box': [petsiOrder.orderedItems[0].id],
            });
        });

        it.each([
            [
                'under count',
                [
                    [MOD_CHOC_1, '2'],
                    [MOD_OAT, '3'],
                ],
            ],
            [
                'over count',
                [
                    [MOD_CHOC_1, '4'],
                    [MOD_OAT, '3'],
                ],
            ],
            [
                'with a disallowed flavor',
                [
                    [MOD_CHOC_1, '3'],
                    [MOD_LEMON, '3'],
                ],
            ],
        ] as [string, [string, string][]][])(
            'makes a box %s a pending container_invalid line and imports the rest',
            async (_label, mods) => {
                const order = squareOrder({
                    lineItems: [
                        line('l-pie', VAR_PIE, '1'),
                        withModifiers('l-box', VAR_BOX, '1', mods),
                    ],
                });
                const result = await ingestService.ingest(connection, order);
                if (result.outcome !== 'created') {
                    throw new Error(result.outcome);
                }

                expect(items(await loadOrder(result.orderId))).toEqual([
                    { menuItemId: applePie.id, quantity: 1 },
                ]);
                expect(await linesFor(order.id!)).toMatchObject([
                    {
                        squareLineUid: 'l-box',
                        squareVariationId: VAR_BOX,
                        reason: 'container_invalid',
                        status: 'pending',
                        quantity: 1,
                    },
                ]);
            },
        );

        it('imports modifier products past an ignored add-on; an unmapped modifier leaves its line pending', async () => {
            const order = squareOrder({
                lineItems: [
                    withModifiers('l-scone', VAR_SCONE, '2', [
                        [MOD_LEMON, '2'],
                        [MOD_OAT],
                        [MOD_SHOT],
                    ]),
                    withModifiers('l-scone-2', VAR_SCONE, '1', [
                        [MOD_CHOC_1],
                        [MOD_UNMAPPED],
                    ]),
                ],
            });
            const result = await ingestService.ingest(connection, order);
            if (result.outcome !== 'created') throw new Error(result.outcome);

            const petsiOrder = await loadOrder(result.orderId);
            expect(items(petsiOrder)).toEqual(
                [
                    { menuItemId: lemonScone.id, quantity: 4 },
                    { menuItemId: oatmeal.id, quantity: 2 },
                ].sort((a, b) => a.menuItemId - b.menuItemId),
            );
            expect(
                (await linkFor(order.id!))?.lineMap['l-scone'].sort(),
            ).toEqual(petsiOrder.orderedItems.map((item) => item.id).sort());
            expect(await linesFor(order.id!)).toMatchObject([
                {
                    squareLineUid: 'l-scone-2',
                    reason: 'unmapped_modifier',
                    status: 'pending',
                },
            ]);
        });

        it('imports a fixed container with its defined contents', async () => {
            const order = squareOrder({
                lineItems: [line('l-platter', VAR_PLATTER, '1')],
            });
            const result = await ingestService.ingest(connection, order);
            if (result.outcome !== 'created') throw new Error(result.outcome);

            const petsiOrder = await loadWithContents(result.orderId);
            expect(contentsOf(petsiOrder, platter.id)).toEqual(
                [
                    { menuItemId: chocChip.id, quantity: 3 },
                    { menuItemId: lemonScone.id, quantity: 2 },
                ].sort((a, b) => a.menuItemId - b.menuItemId),
            );
        });

        it('replaces a box’s contents and a modifier line’s products on a Square update', async () => {
            const squareOrderId = `${P}-box-update`;
            const v1 = squareOrder({
                id: squareOrderId,
                version: 1,
                lineItems: [
                    withModifiers('l-box', VAR_BOX, '1', [
                        [MOD_CHOC_1, '3'],
                        [MOD_OAT, '3'],
                    ]),
                    withModifiers('l-scone', VAR_SCONE, '1', [[MOD_LEMON]]),
                ],
            });
            const created = await ingestService.ingest(connection, v1);
            if (created.outcome !== 'created') {
                throw new Error(created.outcome);
            }
            const boxItemId = (
                await loadOrder(created.orderId)
            ).orderedItems.find((item) => item.menuItem.id === boxOf6.id)!.id;

            const updated = await ingestService.ingest(connection, {
                ...v1,
                version: 2,
                lineItems: [
                    withModifiers('l-box', VAR_BOX, '1', [
                        [MOD_CHOC_1, '1'],
                        [MOD_CHOC_2, '5'],
                    ]),
                    withModifiers('l-scone', VAR_SCONE, '1', [
                        [MOD_LEMON, '2'],
                        [MOD_OAT],
                    ]),
                ],
            });
            expect(updated).toEqual({
                outcome: 'updated',
                orderId: created.orderId,
            });

            const order = await loadWithContents(created.orderId);
            const box = order.orderedItems.find(
                (item) => item.menuItem.id === boxOf6.id,
            )!;
            // Changed in place, not recreated
            expect(box.id).toBe(boxItemId);
            expect(contentsOf(order, boxOf6.id)).toEqual([
                { menuItemId: chocChip.id, quantity: 6 },
            ]);
            expect(items(order)).toEqual(
                [
                    { menuItemId: boxOf6.id, quantity: 1 },
                    { menuItemId: lemonScone.id, quantity: 2 },
                    { menuItemId: oatmeal.id, quantity: 1 },
                ].sort((a, b) => a.menuItemId - b.menuItemId),
            );
            const lineMap = (await linkFor(squareOrderId))!.lineMap;
            expect(lineMap['l-box']).toEqual([boxItemId]);
            expect(lineMap['l-scone']).toHaveLength(2);
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

    describe('order issues', () => {
        /** Square sends a phone and email but no name: Petsi requires a recipient. */
        const noName = (): Square.Fulfillment => ({
            type: 'PICKUP',
            pickupDetails: {
                pickupAt: '2026-11-02T15:00:00Z',
                recipient: {
                    phoneNumber: '555-0199',
                    emailAddress: 'secret@example.com',
                },
            },
        });
        // Fake card data, so the spec can check it never reaches an issue
        const tenders: Square.Tender[] = [
            {
                type: 'CARD',
                cardDetails: { card: { last4: '4242', bin: '411111' } },
            },
        ];

        const issueFor = (squareOrderId: string) =>
            issueRepo.findOne({
                where: { tenantId: tenant.id, squareOrderId },
            });

        it('records a rejected order as an open issue with no order', async () => {
            const order = squareOrder({ fulfillments: [noName()], tenders });

            const result = await ingestService.ingest(connection, order);

            expect(result).toMatchObject({
                outcome: 'rejected',
                reason: 'validation_failed',
            });
            const issue = await issueFor(order.id!);
            expect(issue).toMatchObject({
                status: 'open',
                reason: 'validation_failed',
                squareLocationId: SQ_LOCATION,
                locationId: location.id,
                orderId: null,
                squareVersion: '1',
                detail: {
                    validationErrors: {
                        errorPayload: expect.arrayContaining([
                            expect.objectContaining({
                                fields: ['recipient'],
                            }),
                        ]) as unknown,
                    },
                },
            });
            expect(issue!.lastAttemptAt).toBeInstanceOf(Date);
            // Codes, ids and field names only: no Square body, contact or card
            const detail = JSON.stringify(issue!.detail);
            for (const leaked of ['555-0199', 'secret@', '4242', '411111']) {
                expect(detail).not.toContain(leaked);
            }
            expect(await linkFor(order.id!)).toBeNull();
            expect(
                await orderRepo.count({ where: { tenantId: tenant.id } }),
            ).toBe(0);
        });

        it('records an OrderService rejection the same way', async () => {
            // A mapping the order validator rejects: a size the item lacks
            const small = await sizeRepo.save({
                tenantId: tenant.id,
                name: `${P} Small`,
            });
            const badSize = await variationRepo.save(
                variationRepo.create({
                    tenantId: tenant.id,
                    squareVariationId: `${P}-var-bad-size`,
                    squareItemId: `${P}-var-bad-size-item`,
                    squareItemName: 'Apple Pie',
                    squareVariationName: 'Small',
                    menuItemId: applePie.id,
                    menuItemSizeId: small.id,
                }),
            );
            testCtx.addCleanupFunction(async () => {
                await variationRepo.delete(badSize.id);
                await sizeRepo.delete(small.id);
            });
            const create = jest.spyOn(orderService, 'create');
            const order = squareOrder({
                lineItems: [line('l-small', badSize.squareVariationId)],
            });

            const result = await ingestService.ingest(connection, order);

            expect(create).toHaveBeenCalled();
            expect(result).toMatchObject({
                outcome: 'rejected',
                reason: 'validation_failed',
            });
            expect(await issueFor(order.id!)).toMatchObject({
                status: 'open',
                orderId: null,
                detail: { validationErrors: expect.any(Object) as unknown },
            });
            expect(await linkFor(order.id!)).toBeNull();
            expect(await linesFor(order.id!)).toEqual([]);
        });

        it('creates the order and resolves the issue on a fixing update', async () => {
            const order = squareOrder({ fulfillments: [noName()] });
            await ingestService.ingest(connection, order);

            const result = await ingestService.ingest(connection, {
                ...order,
                version: 2,
                fulfillments: [pickup()],
            });

            if (result.outcome !== 'created') throw new Error(result.outcome);
            expect(await issueFor(order.id!)).toMatchObject({
                status: 'resolved',
                orderId: result.orderId,
                squareVersion: '2',
            });
        });

        it('keeps an imported order unchanged when Petsi rejects its update', async () => {
            const order = squareOrder({});
            const created = await ingestService.ingest(connection, order);
            if (created.outcome !== 'created') throw new Error();

            const result = await ingestService.ingest(connection, {
                ...order,
                version: 2,
                fulfillments: [noName()],
                lineItems: [line('l-pie', VAR_PIE, '5', 'Apple Pie')],
            });

            expect(result.outcome).toBe('rejected');
            expect(await issueFor(order.id!)).toMatchObject({
                status: 'open',
                orderId: created.orderId,
                locationId: location.id,
                squareVersion: '2',
            });
            const saved = await loadOrder(created.orderId);
            expect(saved.recipient).toBe('Jane Doe');
            expect(items(saved)).toEqual([
                { menuItemId: applePie.id, quantity: 2 },
            ]);
            // The link keeps the last imported version, so version 2 retries
            expect((await linkFor(order.id!))?.squareVersion).toBe('1');
        });

        it('records an in-scope order at an unmapped location as location_unmapped', async () => {
            const order = squareOrder({ locationId: SQ_LOCATION_UNMAPPED });

            const result = await ingestService.ingest(connection, order);

            expect(result).toMatchObject({
                outcome: 'rejected',
                reason: 'location_unmapped',
            });
            expect(await issueFor(order.id!)).toMatchObject({
                status: 'open',
                reason: 'location_unmapped',
                squareLocationId: SQ_LOCATION_UNMAPPED,
                locationId: null,
                detail: null,
            });
            expect(await linkFor(order.id!)).toBeNull();
            expect(
                await orderRepo.count({ where: { tenantId: tenant.id } }),
            ).toBe(0);
        });

        it('skips an out-of-scope order at an unmapped location without an issue', async () => {
            const order = squareOrder({
                locationId: SQ_LOCATION_UNMAPPED,
                fulfillments: [{ type: 'IN_STORE' }],
            });

            const result = await ingestService.ingest(connection, order);

            expect(result.outcome).toBe('skipped');
            expect(await issueFor(order.id!)).toBeNull();
        });

        it('keeps a dismissed issue dismissed when the order is rejected again', async () => {
            const order = squareOrder({ fulfillments: [noName()] });
            await ingestService.ingest(connection, order);
            await issueRepo.update(
                { tenantId: tenant.id, squareOrderId: order.id! },
                { status: 'dismissed' },
            );

            await ingestService.ingest(connection, { ...order, version: 2 });

            expect(await issueFor(order.id!)).toMatchObject({
                status: 'dismissed',
                squareVersion: '2',
            });
        });
    });

    describe('cancellation and refunds', () => {
        const issueFor = (squareOrderId: string) =>
            issueRepo.findOne({
                where: { tenantId: tenant.id, squareOrderId },
            });

        /** Imports a pie line and a pending unmapped line. */
        const importOrder = async (overrides: Partial<Square.Order> = {}) => {
            const order = squareOrder({
                version: 1,
                lineItems: [
                    line('l-pie', VAR_PIE, '2'),
                    line('l-new', VAR_UNMAPPED, '1'),
                ],
                ...overrides,
            });
            const result = await ingestService.ingest(connection, order);
            if (result.outcome !== 'created') throw new Error(result.outcome);
            return { order, orderId: result.orderId };
        };

        const expectCancelled = async (
            squareOrderId: string,
            orderId: number,
        ) => {
            const order = await loadOrder(orderId);
            expect(order.status).toBe(ORDER_STATUSES.CANCELLED);
            // Lines are untouched
            expect(items(order)).toEqual([
                { menuItemId: applePie.id, quantity: 2 },
            ]);
            expect(
                (await linesFor(squareOrderId)).map((l) => l.status),
            ).toEqual(['dismissed']);
            expect((await linkFor(squareOrderId))?.squareVersion).toBe('2');
        };

        it('cancels a CANCELED order and dismisses its pending lines', async () => {
            const { order, orderId } = await importOrder();
            const appendRevision = jest.spyOn(
                module.get(RevisionHistoryService),
                'appendRevision',
            );
            appendRevision.mockClear();

            const result = await ingestService.ingest(connection, {
                ...order,
                state: 'CANCELED',
                version: 2,
            });

            expect(result).toEqual({ outcome: 'cancelled', orderId });
            await expectCancelled(order.id!, orderId);
            expect(appendRevision.mock.calls[0][1]).toMatchObject({
                changeLog: { actor: { type: 'square_webhook' } },
            });

            // A repeated cancel is stale
            expect(
                await ingestService.ingest(connection, {
                    ...order,
                    state: 'CANCELED',
                    version: 2,
                }),
            ).toEqual({ outcome: 'stale' });
        });

        it('cancels when every pickup or delivery fulfillment is cancelled or failed', async () => {
            const { order, orderId } = await importOrder({
                fulfillments: [pickup(), pickup()],
            });

            const result = await ingestService.ingest(connection, {
                ...order,
                version: 2,
                fulfillments: [
                    { ...pickup(), state: 'CANCELED' },
                    { ...pickup(), state: 'FAILED' },
                ],
            });

            expect(result).toEqual({ outcome: 'cancelled', orderId });
            await expectCancelled(order.id!, orderId);
        });

        it('records a cancel of a detached order as an issue and leaves the order active', async () => {
            const { order, orderId } = await importOrder();
            await asStaff(() =>
                detachService.detachForCurrentTenant(location.id, orderId),
            );
            const updateSpy = jest.spyOn(orderService, 'update');

            const result = await ingestService.ingest(connection, {
                ...order,
                state: 'CANCELED',
                version: 2,
            });

            expect(result).toMatchObject({
                outcome: 'flagged',
                reason: 'cancelled_while_detached',
            });
            expect(updateSpy).not.toHaveBeenCalled();
            expect((await loadOrder(orderId)).status).toBe(
                ORDER_STATUSES.ACTIVE,
            );
            expect(await issueFor(order.id!)).toMatchObject({
                reason: 'cancelled_while_detached',
                status: 'open',
                orderId,
                locationId: location.id,
            });

            // Dismissed by staff: a redelivered cancel doesn't reopen it
            await issueRepo.update(
                { tenantId: tenant.id, squareOrderId: order.id! },
                { status: 'dismissed' },
            );
            expect(
                await ingestService.ingest(connection, {
                    ...order,
                    state: 'CANCELED',
                    version: 3,
                }),
            ).toEqual({ outcome: 'skipped', reason: 'detached' });
            expect((await issueFor(order.id!))?.status).toBe('dismissed');
        });

        it('records returns as a refund_received issue and leaves the lines unchanged', async () => {
            const { order, orderId } = await importOrder();
            const before = await loadOrder(orderId);
            const returnOf = (uid: string): Square.OrderReturn => ({
                uid,
                returnLineItems: [
                    {
                        uid: `${uid}-line`,
                        sourceLineItemUid: 'l-pie',
                        quantity: '1',
                    },
                ],
            });
            const refunded = {
                ...order,
                version: 2,
                returns: [returnOf('ret-1')],
                returnAmounts: {
                    totalMoney: { amount: 1250n, currency: 'USD' as const },
                },
                tenders: [
                    {
                        type: 'CARD' as const,
                        cardDetails: { card: { last4: '4242' } },
                    },
                ],
            };

            expect(
                (await ingestService.ingest(connection, refunded)).outcome,
            ).toBe('updated');

            const after = await loadOrder(orderId);
            expect(after.status).toBe(ORDER_STATUSES.ACTIVE);
            expect(items(after)).toEqual(items(before));
            expect((await linesFor(order.id!)).map((l) => l.status)).toEqual([
                'pending',
            ]);
            const issue = await issueFor(order.id!);
            expect(issue).toMatchObject({
                reason: 'refund_received',
                status: 'open',
                orderId,
                locationId: location.id,
                squareVersion: '2',
                detail: {
                    refund: {
                        returnUids: ['ret-1'],
                        lines: [{ squareLineUid: 'l-pie', quantity: '1' }],
                        returnedAmount: { amount: '1250', currency: 'USD' },
                    },
                },
            });
            expect(JSON.stringify(issue?.detail)).not.toContain('4242');

            // Staff dismiss it; a later version with the same return keeps it
            // dismissed, a new return reopens it
            await issueRepo.update({ id: issue!.id }, { status: 'dismissed' });
            await ingestService.ingest(connection, { ...refunded, version: 3 });
            expect((await issueFor(order.id!))?.status).toBe('dismissed');

            await ingestService.ingest(connection, {
                ...refunded,
                version: 4,
                returns: [returnOf('ret-1'), returnOf('ret-2')],
            });
            expect(await issueFor(order.id!)).toMatchObject({
                status: 'open',
                detail: { refund: { returnUids: ['ret-1', 'ret-2'] } },
            });
        });

        it('changes nothing on a fulfillment progress change alone', async () => {
            const { order, orderId } = await importOrder();
            const before = await loadOrder(orderId);
            const appendRevision = jest.spyOn(
                module.get(RevisionHistoryService),
                'appendRevision',
            );
            appendRevision.mockClear();

            const result = await ingestService.ingest(connection, {
                ...order,
                version: 2,
                fulfillments: [{ ...pickup(), state: 'PREPARED' }],
            });

            expect(result).toEqual({ outcome: 'updated', orderId });
            expect(appendRevision).not.toHaveBeenCalled();
            const after = await loadOrder(orderId);
            expect(after.status).toBe(ORDER_STATUSES.ACTIVE);
            expect(after.updatedAt).toEqual(before.updatedAt);
            expect(items(after)).toEqual(items(before));
            expect((await linesFor(order.id!)).map((l) => l.status)).toEqual([
                'pending',
            ]);
            expect(await issueFor(order.id!)).toBeNull();
        });

        it('resolves the open issue of a rejected order Square then cancels', async () => {
            const rejected = squareOrder({
                version: 1,
                fulfillments: [
                    {
                        type: 'PICKUP',
                        pickupDetails: { pickupAt: '2026-11-02T15:00:00Z' },
                    },
                ],
            });
            expect(
                (await ingestService.ingest(connection, rejected)).outcome,
            ).toBe('rejected');

            const result = await ingestService.ingest(connection, {
                ...rejected,
                state: 'CANCELED',
                version: 2,
            });

            expect(result).toEqual({ outcome: 'skipped', reason: 'cancelled' });
            expect((await issueFor(rejected.id!))?.status).toBe('resolved');
            expect(await linkFor(rejected.id!)).toBeNull();
        });
    });

    describe('revision actor', () => {
        let appendRevision: jest.SpiedFunction<
            RevisionHistoryService['appendRevision']
        >;

        beforeEach(() => {
            appendRevision = jest.spyOn(
                module.get(RevisionHistoryService),
                'appendRevision',
            );
            appendRevision.mockClear();
        });

        it.each([
            [
                'square_webhook without a triggering user',
                {},
                { type: 'square_webhook' },
            ],
            [
                'the triggering user',
                { actorUserId: 42 },
                { type: 'user', id: 42 },
            ],
        ])('records %s', async (_label, opts, actor) => {
            await ingestService.ingest(connection, squareOrder({}), opts);

            expect(appendRevision.mock.calls[0][1]).toMatchObject({
                changeLog: {
                    kind: 'created',
                    actor,
                },
            });
        });
    });
});
