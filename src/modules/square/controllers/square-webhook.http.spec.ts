import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createHmac } from 'crypto';
import { Square } from 'square';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { createHttpTestApp } from '../../../test/http-test-app';
import { TenantFeature } from '../../feature-flags/entities/tenant-feature.entity';
import { FEATURE_REGISTRY } from '../../feature-flags/utils/feature.registry';
import { Location } from '../../locations/entities/location.entity';
import { LocationTestUtil } from '../../locations/utils/location-test.util';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { Order } from '../../orders/entities/order.entity';
import { RevisionHistoryService } from '../../revision-history/revision-history.service';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { SquareClientFactory } from '../client/square-client.factory';
import { SquareCategoryLink } from '../entities/square-category-link.entity';
import { SquareConnection } from '../entities/square-connection.entity';
import { SquareItemHint } from '../entities/square-item-hint.entity';
import { SquareLocationLink } from '../entities/square-location-link.entity';
import { SquareModifierLink } from '../entities/square-modifier-link.entity';
import { SquareOrderIssue } from '../entities/square-order-issue.entity';
import { SquareOrderLink } from '../entities/square-order-link.entity';
import { SquareSizeAlias } from '../entities/square-size-alias.entity';
import { SquareUnresolvedLine } from '../entities/square-unresolved-line.entity';
import { SquareVariationLink } from '../entities/square-variation-link.entity';
import { SquareWebhookReceipt } from '../entities/square-webhook-receipt.entity';
import { FakeSquareClientFactory } from '../utils/fake-square-client.factory';
import { SQUARE_CONFIG_KEYS } from '../utils/square-config';
import { SquareTestUtil } from '../utils/square-test.util';
import {
    SQUARE_TEST_CONFIG,
    getSquareTestingModule,
} from '../utils/square-testing.module';

const P = `t${Date.now()}`;

const SQ_LOCATION = `${P}-sq-loc`;
const VAR_PIE = `${P}-var-pie`;
const CATALOG_CURSOR = '2026-10-28T12:00:00.000Z';

let eventSeq = 0;
let orderSeq = 0;

describe('Square webhook endpoint (HTTP)', () => {
    let app: INestApplication;
    let fake: FakeSquareClientFactory;
    let signatureKey: string;
    let appendRevision: jest.SpiedFunction<
        RevisionHistoryService['appendRevision']
    >;
    let testCtx: DatabaseTestContext;

    let tenantRepo: Repository<Tenant>;
    let locationRepo: Repository<Location>;
    let featureRepo: Repository<TenantFeature>;
    let connectionRepo: Repository<SquareConnection>;
    let locationLinkRepo: Repository<SquareLocationLink>;
    let variationRepo: Repository<SquareVariationLink>;
    let hintRepo: Repository<SquareItemHint>;
    let orderLinkRepo: Repository<SquareOrderLink>;
    let issueRepo: Repository<SquareOrderIssue>;
    let unresolvedRepo: Repository<SquareUnresolvedLine>;
    let receiptRepo: Repository<SquareWebhookReceipt>;
    let orderRepo: Repository<Order>;
    let menuItemRepo: Repository<MenuItem>;
    let sizeRepo: Repository<MenuItemSize>;
    let catalogRepos: Repository<{ tenantId: number }>[];

    let tenant: Tenant;
    let flaglessTenant: Tenant;
    let location: Location;
    let connection: SquareConnection;
    let flaglessConnection: SquareConnection;
    let large: MenuItemSize;
    let applePie: MenuItem;

    // ─── request helpers ─────────────────────────────────────────────────

    const sign = (body: string) =>
        createHmac('sha256', signatureKey)
            .update(SQUARE_TEST_CONFIG.webhookNotificationUrl + body)
            .digest('base64');

    const post = (body: string, signature = sign(body)) =>
        request(app.getHttpServer())
            .post('/square/webhooks')
            .set('content-type', 'application/json')
            .set('x-square-hmacsha256-signature', signature)
            .send(body);

    const envelope = (
        merchantId: string,
        type: string,
        object: Record<string, unknown>,
        eventId = `${P}-event-${++eventSeq}`,
    ) =>
        JSON.stringify({
            merchant_id: merchantId,
            type,
            event_id: eventId,
            created_at: '2026-10-29T12:00:00Z',
            data: { type: type.split('.')[0], id: 'x', object },
        });

    const orderEvent = (
        squareOrderId: string,
        version: number,
        opts: { merchantId?: string; eventId?: string; type?: string } = {},
    ) =>
        envelope(
            opts.merchantId ?? connection.merchantId,
            opts.type ?? 'order.updated',
            {
                order_updated: {
                    order_id: squareOrderId,
                    version,
                    location_id: SQ_LOCATION,
                    state: 'OPEN',
                },
                order_created: {
                    order_id: squareOrderId,
                    version,
                    location_id: SQ_LOCATION,
                    state: 'OPEN',
                },
            },
            opts.eventId,
        );

    // ─── Square fixtures (recipient fake, no tenders) ────────────────────

    const squareOrder = (id: string, version: number): Square.Order => ({
        id,
        locationId: SQ_LOCATION,
        state: 'OPEN',
        version,
        fulfillments: [
            {
                type: 'PICKUP',
                state: 'PROPOSED',
                pickupDetails: {
                    pickupAt: '2026-11-02T15:00:00Z',
                    recipient: {
                        displayName: 'Jane Doe',
                        phoneNumber: '555-0100',
                    },
                },
            },
        ],
        lineItems: [
            {
                uid: 'l-pie',
                name: 'Apple Pie',
                quantity: String(version),
                catalogObjectId: VAR_PIE,
                basePriceMoney: { amount: 1250n, currency: 'USD' },
            },
        ],
    });

    /** `orders.get` returns `squareOrder(id, version)` for every id. */
    function stubOrder(version: number) {
        const get = jest.fn(
            (req: Square.GetOrdersRequest): Promise<Square.GetOrderResponse> =>
                Promise.resolve({ order: squareOrder(req.orderId, version) }),
        );
        fake.tenantApi.orders.get = get;
        return get;
    }

    const newOrderId = () => `${P}-order-${++orderSeq}`;

    const ordersOf = (t: Tenant) =>
        orderRepo.find({
            where: { tenantId: t.id },
            relations: ['orderedItems'],
        });

    const linkFor = (squareOrderId: string) =>
        orderLinkRepo.findOne({
            where: { tenantId: tenant.id, squareOrderId },
        });

    // ─── setup ───────────────────────────────────────────────────────────

    beforeAll(async () => {
        const module: TestingModule = await getSquareTestingModule();
        fake = module.get(SquareClientFactory);
        signatureKey = module
            .get(ConfigService)
            .getOrThrow<string>(SQUARE_CONFIG_KEYS.WEBHOOK_SIGNATURE_KEY);
        appendRevision = jest.spyOn(
            module.get(RevisionHistoryService),
            'appendRevision',
        );

        tenantRepo = module.get(getRepositoryToken(Tenant));
        locationRepo = module.get(getRepositoryToken(Location));
        featureRepo = module.get(getRepositoryToken(TenantFeature));
        connectionRepo = module.get(getRepositoryToken(SquareConnection));
        locationLinkRepo = module.get(getRepositoryToken(SquareLocationLink));
        variationRepo = module.get(getRepositoryToken(SquareVariationLink));
        hintRepo = module.get(getRepositoryToken(SquareItemHint));
        orderLinkRepo = module.get(getRepositoryToken(SquareOrderLink));
        issueRepo = module.get(getRepositoryToken(SquareOrderIssue));
        unresolvedRepo = module.get(getRepositoryToken(SquareUnresolvedLine));
        receiptRepo = module.get(getRepositoryToken(SquareWebhookReceipt));
        orderRepo = module.get(getRepositoryToken(Order));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
        catalogRepos = [
            SquareModifierLink,
            SquareSizeAlias,
            SquareCategoryLink,
        ].map((entity) => module.get(getRepositoryToken(entity)));

        const locationUtil = module.get(LocationTestUtil);
        tenant = await locationUtil.seedTenant(P);
        flaglessTenant = await locationUtil.seedTenant(`${P}-flagless`);
        ({
            locations: [location],
        } = await locationUtil.seedLocations(P, tenant, 1));
        await featureRepo.save({
            tenantId: tenant.id,
            feature: FEATURE_REGISTRY.SQUARE_INTEGRATION,
        });

        large = await sizeRepo.save({
            tenantId: tenant.id,
            name: `${P} Large`,
        });
        applePie = await menuItemRepo.save(
            menuItemRepo.create({
                tenantId: tenant.id,
                name: `${P} Apple Pie`,
                type: MENU_ITEM_TYPES.SINGLE,
                sizes: [large],
            }),
        );

        const squareTestUtil = module.get(SquareTestUtil);
        connection = await squareTestUtil.seedConnection(P, tenant.id, {
            catalogSyncedAt: CATALOG_CURSOR,
        });
        flaglessConnection = await squareTestUtil.seedConnection(
            P,
            flaglessTenant.id,
        );
        await locationLinkRepo.save(
            [tenant, flaglessTenant].map((t) => ({
                tenantId: t.id,
                squareLocationId: SQ_LOCATION,
                squareName: `${P} Main`,
                timezone: 'America/New_York',
                enabled: true,
                locationId: location.id,
            })),
        );
        await variationRepo.save(
            variationRepo.create({
                tenantId: tenant.id,
                squareVariationId: VAR_PIE,
                squareItemId: `${P}-item-pie`,
                squareItemName: 'Apple Pie',
                squareVariationName: 'Large',
                menuItemId: applePie.id,
                menuItemSizeId: large.id,
            }),
        );

        ({ app } = await createHttpTestApp(module));
    });

    afterAll(async () => {
        for (const t of [tenant, flaglessTenant]) {
            await variationRepo.delete({ tenantId: t.id });
            await hintRepo.delete({ tenantId: t.id });
            for (const repo of catalogRepos) {
                await repo.delete({ tenantId: t.id });
            }
            await locationLinkRepo.delete({ tenantId: t.id });
            await connectionRepo.delete({ tenantId: t.id });
            await featureRepo.delete({ tenantId: t.id });
        }
        await menuItemRepo.delete({ tenantId: tenant.id });
        await sizeRepo.delete({ tenantId: tenant.id });
        await locationRepo.delete({ id: location.id });
        await tenantRepo.delete([tenant.id, flaglessTenant.id]);
        await app.close();
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
        fake.reset();
        appendRevision.mockClear();
        testCtx.addCleanupFunction(async () => {
            for (const t of [tenant, flaglessTenant]) {
                await receiptRepo.delete({ tenantId: t.id });
                await issueRepo.delete({ tenantId: t.id });
                await unresolvedRepo.delete({ tenantId: t.id });
                await orderLinkRepo.delete({ tenantId: t.id });
                await orderRepo.delete({ tenantId: t.id });
            }
        });
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    // ─── transport ───────────────────────────────────────────────────────

    describe('order events', () => {
        it('imports the order from a validly signed event, as the square_webhook actor', async () => {
            const get = stubOrder(1);
            const squareOrderId = newOrderId();

            await post(
                orderEvent(squareOrderId, 1, { type: 'order.created' }),
            ).expect(200);

            expect(get).toHaveBeenCalledWith({ orderId: squareOrderId });
            const [order] = await ordersOf(tenant);
            expect(order.orderedItems).toHaveLength(1);
            expect(order.orderedItems[0].quantity).toBe(1);
            expect((await linkFor(squareOrderId))?.orderId).toBe(order.id);
            expect(appendRevision).toHaveBeenCalledTimes(1);
            expect(appendRevision.mock.calls[0][1]).toMatchObject({
                entityId: order.id,
                changeLog: {
                    kind: 'created',
                    actor: { type: 'square_webhook' },
                },
            });
        });

        it('rejects a tampered body with 403 and writes nothing', async () => {
            const get = stubOrder(1);
            const squareOrderId = newOrderId();
            const body = orderEvent(squareOrderId, 1);
            const tampered = body.replace(squareOrderId, `${squareOrderId}x`);

            await post(tampered, sign(body)).expect(403);
            await post(body, '').expect(403);

            expect(get).not.toHaveBeenCalled();
            expect(await ordersOf(tenant)).toEqual([]);
            expect(
                await receiptRepo.count({ where: { tenantId: tenant.id } }),
            ).toBe(0);
        });

        it('writes nothing for a repeated event id', async () => {
            const squareOrderId = newOrderId();
            const eventId = `${P}-event-dup`;
            stubOrder(1);
            await post(orderEvent(squareOrderId, 1, { eventId })).expect(200);
            const [before] = await ordersOf(tenant);

            // Same delivery again, though Square's order has moved on meanwhile
            const get = stubOrder(2);
            await post(orderEvent(squareOrderId, 2, { eventId })).expect(200);

            expect(get).not.toHaveBeenCalled();
            const [after] = await ordersOf(tenant);
            expect(after.orderedItems[0].quantity).toBe(
                before.orderedItems[0].quantity,
            );
            expect((await linkFor(squareOrderId))?.squareVersion).toBe('1');
        });

        it('ignores a stale order version', async () => {
            const squareOrderId = newOrderId();
            stubOrder(2);
            await post(orderEvent(squareOrderId, 2)).expect(200);
            appendRevision.mockClear();

            // An older event arriving late is dropped without a fetch
            const get = stubOrder(1);
            await post(orderEvent(squareOrderId, 1)).expect(200);
            expect(get).not.toHaveBeenCalled();

            // An event without a version still fetches, and ingest rejects the stale order
            await post(
                envelope(connection.merchantId, 'order.updated', {
                    order_updated: { order_id: squareOrderId },
                }),
            ).expect(200);
            expect(get).toHaveBeenCalledTimes(1);

            const [order] = await ordersOf(tenant);
            expect(order.orderedItems[0].quantity).toBe(2);
            expect((await linkFor(squareOrderId))?.squareVersion).toBe('2');
            expect(appendRevision).not.toHaveBeenCalled();
        });

        it('acknowledges and drops events for a tenant without SQUARE_INTEGRATION', async () => {
            const get = stubOrder(1);

            await post(
                orderEvent(newOrderId(), 1, {
                    merchantId: flaglessConnection.merchantId,
                }),
            ).expect(200);

            expect(get).not.toHaveBeenCalled();
            expect(await ordersOf(flaglessTenant)).toEqual([]);
            expect(
                await orderLinkRepo.count({
                    where: { tenantId: flaglessTenant.id },
                }),
            ).toBe(0);
            expect(
                await receiptRepo.count({
                    where: { tenantId: flaglessTenant.id },
                }),
            ).toBe(0);
        });

        it('acknowledges events for an unknown merchant', async () => {
            const get = stubOrder(1);
            await post(
                orderEvent(newOrderId(), 1, { merchantId: `${P}-nobody` }),
            ).expect(200);
            expect(get).not.toHaveBeenCalled();
        });

        it('still acknowledges an order Petsi rejects, and accepts a redelivery after a failure', async () => {
            const squareOrderId = newOrderId();
            const eventId = `${P}-event-retry`;
            fake.tenantApi.orders.get = () =>
                Promise.reject(new Error('connection reset'));
            await post(orderEvent(squareOrderId, 1, { eventId })).expect(500);

            // The failed attempt didn't consume the event id
            stubOrder(1);
            await post(orderEvent(squareOrderId, 1, { eventId })).expect(200);
            expect(await ordersOf(tenant)).toHaveLength(1);

            // A rejected order (here: no recipient) is still a 200
            fake.tenantApi.orders.get = (req) =>
                Promise.resolve({
                    order: {
                        ...squareOrder(req.orderId, 1),
                        fulfillments: [{ type: 'PICKUP', pickupDetails: {} }],
                    },
                });
            const rejectedId = newOrderId();
            await post(orderEvent(rejectedId, 1)).expect(200);
            expect(await ordersOf(tenant)).toHaveLength(1);
            expect(
                await issueRepo.findOneBy({
                    tenantId: tenant.id,
                    squareOrderId: rejectedId,
                }),
            ).toMatchObject({ reason: 'validation_failed', status: 'open' });
        });
    });

    describe('catalog.version.updated', () => {
        afterEach(async () => {
            await variationRepo.delete({
                tenantId: tenant.id,
                squareItemId: `${P}-item-new`,
            });
            await variationRepo.delete({
                tenantId: tenant.id,
                squareItemId: `${P}-item-old`,
            });
            await hintRepo.delete({ tenantId: tenant.id });
            await connectionRepo.update(
                { id: connection.id },
                { catalogSyncedAt: CATALOG_CURSOR },
            );
        });

        it('syncs from the stored cursor: a new item needs review and a deleted one is flagged', async () => {
            await variationRepo.save(
                variationRepo.create({
                    tenantId: tenant.id,
                    squareVariationId: `${P}-var-old`,
                    squareItemId: `${P}-item-old`,
                    squareItemName: 'Old Pie',
                    squareVariationName: 'Large',
                    reviewedAt: new Date(),
                }),
            );
            const variation = (
                id: string,
                itemId: string,
            ): Square.CatalogObject => ({
                type: 'ITEM_VARIATION',
                id,
                version: 2n,
                itemVariationData: { itemId, name: 'Large' },
            });
            const search = jest.fn(
                (): Promise<Square.SearchCatalogObjectsResponse> =>
                    Promise.resolve({
                        latestTime: '2026-10-29T12:00:00.000Z',
                        objects: [
                            {
                                type: 'ITEM',
                                id: `${P}-item-new`,
                                version: 2n,
                                itemData: {
                                    name: `${P} New Pie`,
                                    variations: [
                                        variation(
                                            `${P}-var-new`,
                                            `${P}-item-new`,
                                        ),
                                    ],
                                },
                            },
                            {
                                type: 'ITEM',
                                id: `${P}-item-old`,
                                version: 2n,
                                isDeleted: true,
                                itemData: {
                                    name: 'Old Pie',
                                    variations: [
                                        {
                                            ...variation(
                                                `${P}-var-old`,
                                                `${P}-item-old`,
                                            ),
                                            isDeleted: true,
                                        },
                                    ],
                                },
                            },
                        ],
                    }),
            );
            fake.tenantApi.catalog.search = search;

            await post(
                envelope(connection.merchantId, 'catalog.version.updated', {
                    catalog_version: { updated_at: '2026-10-29T12:00:00Z' },
                }),
            ).expect(200);

            expect(search).toHaveBeenCalledWith(
                expect.objectContaining({
                    beginTime: CATALOG_CURSOR,
                    includeDeletedObjects: true,
                }),
            );
            const added = await variationRepo.findOneByOrFail({
                tenantId: tenant.id,
                squareVariationId: `${P}-var-new`,
            });
            expect(added).toMatchObject({ isDeleted: false, reviewedAt: null });
            const removed = await variationRepo.findOneByOrFail({
                tenantId: tenant.id,
                squareVariationId: `${P}-var-old`,
            });
            expect(removed.isDeleted).toBe(true);
            expect(
                (await connectionRepo.findOneByOrFail({ id: connection.id }))
                    .catalogSyncedAt,
            ).toBe('2026-10-29T12:00:00.000Z');
        });
    });

    describe('oauth.authorization.revoked', () => {
        it('disconnects the tenant and keeps its link tables, even without the flag', async () => {
            for (const target of [connection, flaglessConnection]) {
                await post(
                    envelope(target.merchantId, 'oauth.authorization.revoked', {
                        revocation: {
                            revoked_at: '2026-10-29T12:00:00Z',
                            revoker_type: 'MERCHANT',
                        },
                    }),
                ).expect(200);

                const stored = await connectionRepo.findOneByOrFail({
                    id: target.id,
                });
                expect(stored).toMatchObject({
                    status: 'disconnected',
                    accessToken: null,
                    refreshToken: null,
                });
                expect(
                    await locationLinkRepo.count({
                        where: { tenantId: target.tenantId },
                    }),
                ).toBe(1);
            }
            expect(
                await variationRepo.count({ where: { tenantId: tenant.id } }),
            ).toBe(1);

            // A disconnected tenant's order events are dropped
            const get = stubOrder(1);
            await post(orderEvent(newOrderId(), 1)).expect(200);
            expect(get).not.toHaveBeenCalled();

            await connectionRepo.update(
                { id: connection.id },
                { status: 'connected', accessToken: connection.accessToken },
            );
        });
    });
});
