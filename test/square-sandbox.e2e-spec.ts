import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Square } from 'square';
import { Repository } from 'typeorm';
import { Location } from '../src/modules/locations/entities/location.entity';
import { LocationTestUtil } from '../src/modules/locations/utils/location-test.util';
import { Order } from '../src/modules/orders/entities/order.entity';
import { Tenant } from '../src/modules/tenants/entities/tenant.entity';
import { SquareClientFactory } from '../src/modules/square/client/square-client.factory';
import { SquareCategoryLink } from '../src/modules/square/entities/square-category-link.entity';
import { SquareConnection } from '../src/modules/square/entities/square-connection.entity';
import { SquareItemHint } from '../src/modules/square/entities/square-item-hint.entity';
import { SquareLocationLink } from '../src/modules/square/entities/square-location-link.entity';
import { SquareModifierLink } from '../src/modules/square/entities/square-modifier-link.entity';
import { SquareOrderIssue } from '../src/modules/square/entities/square-order-issue.entity';
import { SquareOrderLink } from '../src/modules/square/entities/square-order-link.entity';
import { SquareUnresolvedLine } from '../src/modules/square/entities/square-unresolved-line.entity';
import { SquareVariationLink } from '../src/modules/square/entities/square-variation-link.entity';
import { SquareCatalogSyncService } from '../src/modules/square/services/square-catalog-sync.service';
import { SquareConnectionService } from '../src/modules/square/services/square-connection.service';
import { SquareLocationImportService } from '../src/modules/square/services/square-location-import.service';
import { SquareLocationSyncService } from '../src/modules/square/services/square-location-sync.service';
import { SquareOrderIngestService } from '../src/modules/square/services/square-order-ingest.service';
import { SquareTokenCryptoService } from '../src/modules/square/services/square-token-crypto.service';
import { SquareTestUtil } from '../src/modules/square/utils/square-test.util';
import { getSquareTestingModule } from '../src/modules/square/utils/square-testing.module';

/**
 * Opt-in: talks to the real Square Sandbox, so it only runs when
 * `SQUARE_SANDBOX_ACCESS_TOKEN` is set, and never in `npm run test` (which only
 * picks up `src/**\/*.spec.ts`). Run with `npm run test:square-sandbox`.
 *
 * - `SQUARE_SANDBOX_ACCESS_TOKEN` (required): a Sandbox seller token with
 *   ORDERS_READ, ITEMS_READ and MERCHANT_PROFILE_READ.
 * - `SQUARE_SANDBOX_LOCATION_ID` (optional): the Square location to use;
 *   defaults to the first ACTIVE one.
 * - `SQUARE_SANDBOX_ORDER_ID` (optional): the order to fetch and ingest;
 *   defaults to the newest OPEN pickup/delivery order at the location that has
 *   a recipient and a due time.
 *
 * Read-only towards Square: the Sandbox must already hold that order (create
 * one with a pickup fulfillment and a recipient in API Explorer).
 */
const TOKEN = process.env.SQUARE_SANDBOX_ACCESS_TOKEN;
const LOCATION_ID = process.env.SQUARE_SANDBOX_LOCATION_ID;
const ORDER_ID = process.env.SQUARE_SANDBOX_ORDER_ID;

const describeSandbox = TOKEN ? describe : describe.skip;

const P = `t${Date.now()}`;

/** The pickup or delivery fulfillment ingest would import, if any. */
function importableFulfillment(
    order: Square.Order,
): Square.Fulfillment | undefined {
    return order.fulfillments?.find(
        (f) =>
            (f.type === 'PICKUP' &&
                f.pickupDetails?.recipient?.displayName &&
                f.pickupDetails.pickupAt) ||
            (f.type === 'DELIVERY' &&
                f.deliveryDetails?.recipient?.displayName &&
                f.deliveryDetails.deliverAt),
    );
}

describeSandbox('Square Sandbox (opt-in e2e)', () => {
    let module: TestingModule;
    let connectionService: SquareConnectionService;
    let locationSync: SquareLocationSyncService;
    let catalogSync: SquareCatalogSyncService;
    let ingest: SquareOrderIngestService;
    let importService: SquareLocationImportService;

    let connectionRepo: Repository<SquareConnection>;
    let locationLinkRepo: Repository<SquareLocationLink>;
    let categoryRepo: Repository<SquareCategoryLink>;
    let itemHintRepo: Repository<SquareItemHint>;
    let variationRepo: Repository<SquareVariationLink>;
    let modifierRepo: Repository<SquareModifierLink>;
    let orderLinkRepo: Repository<SquareOrderLink>;
    let issueRepo: Repository<SquareOrderIssue>;
    let unresolvedRepo: Repository<SquareUnresolvedLine>;
    let orderRepo: Repository<Order>;
    let locationRepo: Repository<Location>;
    let tenantRepo: Repository<Tenant>;

    let tenant: Tenant;
    let location: Location;
    let connection: SquareConnection;

    beforeAll(async () => {
        // The real factory, so calls reach Square (Sandbox: NODE_ENV isn't
        // 'production')
        module = await getSquareTestingModule({
            squareClientFactoryClass: SquareClientFactory,
        });
        connectionService = module.get(SquareConnectionService);
        locationSync = module.get(SquareLocationSyncService);
        catalogSync = module.get(SquareCatalogSyncService);
        ingest = module.get(SquareOrderIngestService);
        importService = module.get(SquareLocationImportService);

        connectionRepo = module.get(getRepositoryToken(SquareConnection));
        locationLinkRepo = module.get(getRepositoryToken(SquareLocationLink));
        categoryRepo = module.get(getRepositoryToken(SquareCategoryLink));
        itemHintRepo = module.get(getRepositoryToken(SquareItemHint));
        variationRepo = module.get(getRepositoryToken(SquareVariationLink));
        modifierRepo = module.get(getRepositoryToken(SquareModifierLink));
        orderLinkRepo = module.get(getRepositoryToken(SquareOrderLink));
        issueRepo = module.get(getRepositoryToken(SquareOrderIssue));
        unresolvedRepo = module.get(getRepositoryToken(SquareUnresolvedLine));
        orderRepo = module.get(getRepositoryToken(Order));
        locationRepo = module.get(getRepositoryToken(Location));
        tenantRepo = module.get(getRepositoryToken(Tenant));

        const locationUtil = module.get(LocationTestUtil);
        tenant = await locationUtil.seedTenant(P);
        ({
            locations: [location],
        } = await locationUtil.seedLocations(P, tenant, 1));

        // The merchant id is a placeholder: it's unique, the real one may
        // already be connected to a dev tenant, and calls only use the token
        connection = await module
            .get(SquareTestUtil)
            .seedConnection(P, tenant.id, {
                accessToken: module
                    .get(SquareTokenCryptoService)
                    .encrypt(TOKEN!),
            });
    });

    afterAll(async () => {
        if (tenant) {
            const tenantId = tenant.id;
            await unresolvedRepo.delete({ tenantId });
            await issueRepo.delete({ tenantId });
            await orderLinkRepo.delete({ tenantId });
            await orderRepo.delete({ tenantId });
            await modifierRepo.delete({ tenantId });
            await variationRepo.delete({ tenantId });
            await itemHintRepo.delete({ tenantId });
            await categoryRepo.delete({ tenantId });
            await locationLinkRepo.delete({ tenantId });
            await connectionRepo.delete({ tenantId });
            await locationRepo.delete({ id: location.id });
            await tenantRepo.delete(tenantId);
        }
        await module?.close();
    });

    describe('sync and ingest lifecycle', () => {
        let link: SquareLocationLink;
        let squareOrder: Square.Order;

        it('reaches Square with the connection', async () => {
            const { merchant } = await connectionService.callTenant(
                connection,
                (api) => api.merchants.get({ merchantId: 'me' }),
            );
            expect(merchant?.id).toBeDefined();
        });

        it('syncs locations into disabled links', async () => {
            await locationSync.sync(connection);

            const links = await locationLinkRepo.find({
                where: { tenantId: tenant.id },
            });
            expect(links.length).toBeGreaterThan(0);
            expect(links.every((l) => !l.enabled)).toBe(true);

            const found = LOCATION_ID
                ? links.find((l) => l.squareLocationId === LOCATION_ID)
                : links.find((l) => l.squareStatus === 'ACTIVE');
            expect(found).toBeDefined();
            link = found!;
            expect(link.timezone).toBeTruthy();
        });

        it('runs a full catalog sync', async () => {
            await catalogSync.fullSync(connection);

            expect(
                await variationRepo.count({ where: { tenantId: tenant.id } }),
            ).toBeGreaterThan(0);
            const reloaded = await connectionRepo.findOneByOrFail({
                id: connection.id,
            });
            expect(reloaded.catalogSyncedAt).toBeTruthy();
            connection = reloaded;
        });

        it('finds a real pickup or delivery order', async () => {
            if (ORDER_ID) {
                const { order } = await connectionService.callTenant(
                    connection,
                    (api) => api.orders.get({ orderId: ORDER_ID }),
                );
                expect(order).toBeDefined();
                squareOrder = order!;
            } else {
                const { orders } = await connectionService.callTenant(
                    connection,
                    (api) =>
                        api.orders.search({
                            locationIds: [link.squareLocationId],
                            limit: 50,
                            query: {
                                filter: {
                                    stateFilter: { states: ['OPEN'] },
                                    fulfillmentFilter: {
                                        fulfillmentTypes: [
                                            'PICKUP',
                                            'DELIVERY',
                                        ],
                                    },
                                },
                                sort: {
                                    sortField: 'CREATED_AT',
                                    sortOrder: 'DESC',
                                },
                            },
                        }),
                );
                const found = orders?.find((o) => importableFulfillment(o));
                if (!found) {
                    throw new Error(
                        `No OPEN pickup/delivery order with a recipient at Square location ${link.squareLocationId}. ` +
                            'Create one in API Explorer, or set SQUARE_SANDBOX_ORDER_ID.',
                    );
                }
                squareOrder = found;
            }
            expect(squareOrder.locationId).toBe(link.squareLocationId);
            expect(importableFulfillment(squareOrder)).toBeDefined();
        });

        it('ingests the order into a Petsi order', async () => {
            await locationLinkRepo.update(link.id, {
                locationId: location.id,
                enabled: true,
            });

            const result = await ingest.ingest(connection, squareOrder);

            expect(result.outcome).toBe('created');
            const orderLink = await orderLinkRepo.findOneByOrFail({
                tenantId: tenant.id,
                squareOrderId: squareOrder.id!,
            });
            expect(orderLink.squareVersion).toBe(
                String(squareOrder.version ?? 0),
            );
            const order = await orderRepo.findOneByOrFail({
                id: orderLink.orderId!,
            });
            expect(order.locationId).toBe(location.id);
            const fulfillment = importableFulfillment(squareOrder)!;
            const recipient = (
                fulfillment.pickupDetails ?? fulfillment.deliveryDetails
            )?.recipient?.displayName;
            expect(order.recipient).toBe(recipient);
        });

        it('treats the same version as stale', async () => {
            const result = await ingest.ingest(connection, squareOrder);
            expect(result.outcome).toBe('stale');
        });

        it('runs the location import against Sandbox idempotently', async () => {
            const reloaded = await locationLinkRepo.findOneByOrFail({
                id: link.id,
            });

            const result = await importService.importLocation(
                reloaded,
                undefined,
            );

            // The order ingested above is never written twice
            expect(result.found).toBeGreaterThanOrEqual(result.pastDue);
            expect(
                await orderLinkRepo.count({
                    where: {
                        tenantId: tenant.id,
                        squareOrderId: squareOrder.id!,
                    },
                }),
            ).toBe(1);
        });
    });
});
