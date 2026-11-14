import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Square } from 'square';
import { Repository } from 'typeorm';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { Location } from '../../locations/entities/location.entity';
import { LocationTestUtil } from '../../locations/utils/location-test.util';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { OrderMenuItem } from '../../orders/entities/order-menu-item.entity';
import { Order } from '../../orders/entities/order.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { RevisionHistoryService } from '../../revision-history/revision-history.service';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { SquareClientFactory } from '../client/square-client.factory';
import { SquareReauthRequiredException } from '../client/square-error-boundary';
import { SquareConnection } from '../entities/square-connection.entity';
import { SquareLocationLink } from '../entities/square-location-link.entity';
import { SquareOrderIssue } from '../entities/square-order-issue.entity';
import { SquareOrderLink } from '../entities/square-order-link.entity';
import { SquareUnresolvedLine } from '../entities/square-unresolved-line.entity';
import { SquareVariationLink } from '../entities/square-variation-link.entity';
import { FakeSquareClientFactory } from '../utils/fake-square-client.factory';
import { SquareTestUtil } from '../utils/square-test.util';
import { getSquareTestingModule } from '../utils/square-testing.module';
import {
    SQUARE_IMPORT_COMPLETED_LOOKBACK_DAYS,
    SquareLocationImportService,
} from './square-location-import.service';
import { SquareLocationLinkService } from './square-location-link.service';

const P = `t${Date.now()}`;

const VAR_PIE = `${P}-var-pie`;
const VAR_UNMAPPED = `${P}-var-unmapped`;
const ACTOR_USER_ID = 77;
const DAY_MS = 86_400_000;

// ─── Square fixtures (recipients fake, tenders stripped) ────────────────────

const pickupAt = (at: Date | string): Square.Fulfillment => ({
    type: 'PICKUP',
    state: 'PROPOSED',
    pickupDetails: {
        pickupAt: typeof at === 'string' ? at : at.toISOString(),
        recipient: { displayName: 'Jane Doe', phoneNumber: '555-0100' },
    },
});

let orderSeq = 0;

describe('SquareLocationImportService', () => {
    let module: TestingModule;
    let fake: FakeSquareClientFactory;
    let importService: SquareLocationImportService;
    let linkService: SquareLocationLinkService;
    let requestContext: TestRequestContextService;
    let orderRepo: Repository<Order>;
    let orderItemRepo: Repository<OrderMenuItem>;
    let orderLinkRepo: Repository<SquareOrderLink>;
    let issueRepo: Repository<SquareOrderIssue>;
    let unresolvedRepo: Repository<SquareUnresolvedLine>;
    let locationLinkRepo: Repository<SquareLocationLink>;
    let variationRepo: Repository<SquareVariationLink>;
    let connectionRepo: Repository<SquareConnection>;
    let menuItemRepo: Repository<MenuItem>;
    let sizeRepo: Repository<MenuItemSize>;
    let locationRepo: Repository<Location>;
    let tenantRepo: Repository<Tenant>;
    let testCtx: DatabaseTestContext;

    let tenant: Tenant;
    let location: Location;
    let connection: SquareConnection;

    /**
     * Orders Square returns for the `OPEN` / `COMPLETED` search, one page
     * per array.
     */
    let searchPages: Square.Order[][];
    let completedPages: Square.Order[][];
    let searchRequests: Square.SearchOrdersRequest[];

    const squareOrder = (
        squareLocationId: string,
        overrides: Partial<Square.Order>,
    ): Square.Order => ({
        id: `${P}-order-${++orderSeq}`,
        locationId: squareLocationId,
        state: 'OPEN',
        version: 1,
        fulfillments: [pickupAt(new Date(Date.now() + 3 * DAY_MS))],
        lineItems: [
            {
                uid: 'l-pie',
                name: 'Apple Pie',
                quantity: '2',
                catalogObjectId: VAR_PIE,
            },
        ],
        ...overrides,
    });

    /** A mapped location link, disabled unless `enabled` is set. */
    async function seedLink(
        suffix: string,
        overrides: Partial<SquareLocationLink> = {},
    ): Promise<SquareLocationLink> {
        const link = await locationLinkRepo.save({
            tenantId: tenant.id,
            squareLocationId: `${P}-sq-${suffix}`,
            squareName: `${P} ${suffix}`,
            timezone: 'America/New_York',
            enabled: false,
            locationId: location.id,
            ...overrides,
        });
        testCtx.addCleanupFunction(async () => {
            await locationLinkRepo.delete(link.id);
        });
        return link;
    }

    const linkFor = (squareOrderId: string) =>
        orderLinkRepo.findOne({
            where: { tenantId: tenant.id, squareOrderId },
        });

    beforeAll(async () => {
        module = await getSquareTestingModule();
        fake = module.get(SquareClientFactory);
        importService = module.get(SquareLocationImportService);
        linkService = module.get(SquareLocationLinkService);
        requestContext = module.get(RequestContextService);
        orderRepo = module.get(getRepositoryToken(Order));
        orderItemRepo = module.get(getRepositoryToken(OrderMenuItem));
        orderLinkRepo = module.get(getRepositoryToken(SquareOrderLink));
        issueRepo = module.get(getRepositoryToken(SquareOrderIssue));
        unresolvedRepo = module.get(getRepositoryToken(SquareUnresolvedLine));
        locationLinkRepo = module.get(getRepositoryToken(SquareLocationLink));
        variationRepo = module.get(getRepositoryToken(SquareVariationLink));
        connectionRepo = module.get(getRepositoryToken(SquareConnection));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
        locationRepo = module.get(getRepositoryToken(Location));
        tenantRepo = module.get(getRepositoryToken(Tenant));

        const locationUtil = module.get(LocationTestUtil);
        tenant = await locationUtil.seedTenant(P);
        ({
            locations: [location],
        } = await locationUtil.seedLocations(P, tenant, 1));
        const large = await sizeRepo.save({
            tenantId: tenant.id,
            name: `${P} Large`,
        });
        const applePie = await menuItemRepo.save(
            menuItemRepo.create({
                tenantId: tenant.id,
                name: `${P} Apple Pie`,
                type: MENU_ITEM_TYPES.SINGLE,
                sizes: [large],
            }),
        );
        await variationRepo.save([
            variationRepo.create({
                tenantId: tenant.id,
                squareVariationId: VAR_PIE,
                squareItemId: `${VAR_PIE}-item`,
                squareItemName: 'Apple Pie',
                squareVariationName: 'Large',
                menuItemId: applePie.id,
                menuItemSizeId: large.id,
            }),
            variationRepo.create({
                tenantId: tenant.id,
                squareVariationId: VAR_UNMAPPED,
                squareItemId: `${VAR_UNMAPPED}-item`,
                squareItemName: 'Mystery',
                squareVariationName: 'Large',
            }),
        ]);
        connection = await module
            .get(SquareTestUtil)
            .seedConnection(P, tenant.id);
    });

    afterAll(async () => {
        await variationRepo.delete({ tenantId: tenant.id });
        await locationLinkRepo.delete({ tenantId: tenant.id });
        await connectionRepo.delete({ tenantId: tenant.id });
        await menuItemRepo.delete({ tenantId: tenant.id });
        await sizeRepo.delete({ tenantId: tenant.id });
        await locationRepo.delete({ id: location.id });
        await tenantRepo.delete(tenant.id);
        await module.close();
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
        fake.reset();
        searchPages = [];
        completedPages = [];
        searchRequests = [];
        fake.tenantApi.orders.search = (request) => {
            searchRequests.push(request);
            const pages = request.query?.filter?.stateFilter?.states.includes(
                'COMPLETED',
            )
                ? completedPages
                : searchPages;
            const page = request.cursor ? Number(request.cursor) : 0;
            return Promise.resolve({
                orders: pages[page] ?? [],
                cursor: page + 1 < pages.length ? String(page + 1) : undefined,
            });
        };
        // The tenant admin who enables or re-syncs
        requestContext.setContext({
            tenantId: tenant.id,
            isTenantAdmin: true,
            userId: ACTOR_USER_ID,
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

    describe('enabling a location', () => {
        it('imports future-due orders and skips past-due ones', async () => {
            const link = await seedLink('enable');
            const future = squareOrder(link.squareLocationId, {});
            const past = squareOrder(link.squareLocationId, {
                fulfillments: [pickupAt(new Date(Date.now() - 3 * DAY_MS))],
            });
            searchPages = [[future, past]];

            await linkService.setEnabledForCurrentTenant(link.id, true);

            expect(searchRequests).toEqual([
                expect.objectContaining({
                    locationIds: [link.squareLocationId],
                    query: {
                        filter: {
                            stateFilter: { states: ['OPEN'] },
                            fulfillmentFilter: {
                                fulfillmentTypes: ['PICKUP', 'DELIVERY'],
                            },
                        },
                    },
                }),
                // The COMPLETED search's filter is covered under re-sync
                expect.objectContaining({
                    locationIds: [link.squareLocationId],
                }),
            ]);
            expect(
                searchRequests[1].query?.filter?.stateFilter?.states,
            ).toEqual(['COMPLETED']);
            const futureLink = await linkFor(future.id!);
            expect(futureLink?.status).toBe('linked');
            expect(
                await orderRepo.findOneBy({ id: futureLink!.orderId! }),
            ).toMatchObject({ locationId: location.id, recipient: 'Jane Doe' });
            expect(await linkFor(past.id!)).toBeNull();
        });

        it("records the enabling user as the imported orders' revision actor", async () => {
            const appendRevision = jest.spyOn(
                module.get(RevisionHistoryService),
                'appendRevision',
            );
            // The default mock is shared across tests
            appendRevision.mockClear();
            const link = await seedLink('actor');
            searchPages = [[squareOrder(link.squareLocationId, {})]];

            await linkService.setEnabledForCurrentTenant(link.id, true);

            expect(appendRevision).toHaveBeenCalledTimes(1);
            expect(appendRevision.mock.calls[0][1]).toMatchObject({
                changeLog: {
                    kind: 'created',
                    actor: { type: 'user', id: ACTOR_USER_ID },
                },
            });
        });

        it('refuses to enable while the connection needs re-authorization', async () => {
            const link = await seedLink('reauth');
            await connectionRepo.update(connection.id, {
                status: 'needs_reauth',
            });
            try {
                await expect(
                    linkService.setEnabledForCurrentTenant(link.id, true),
                ).rejects.toThrow(SquareReauthRequiredException);
            } finally {
                await connectionRepo.update(connection.id, {
                    status: 'connected',
                });
            }
            expect(searchRequests).toEqual([]);
            expect(
                (await locationLinkRepo.findOneByOrFail({ id: link.id }))
                    .enabled,
            ).toBe(false);
        });
    });

    describe('import window', () => {
        // 2026-11-02 02:00 UTC = 2026-11-01 21:00 in New York (EST)
        const now = new Date('2026-11-02T02:00:00Z');

        it('imports an order due later today in the location timezone, past UTC midnight', async () => {
            const link = await seedLink('tz', { enabled: true });
            // 23:00 New York on Nov 1, still "today" there; Nov 2 in UTC
            const lateToday = squareOrder(link.squareLocationId, {
                fulfillments: [pickupAt('2026-11-02T04:00:00Z')],
            });
            // 09:00 New York on Oct 31: a past local day
            const yesterday = squareOrder(link.squareLocationId, {
                fulfillments: [pickupAt('2026-10-31T13:00:00Z')],
            });
            searchPages = [[lateToday, yesterday]];

            const result = await importService.importLocation(
                link,
                ACTOR_USER_ID,
                now,
            );

            expect(result).toMatchObject({ found: 2, pastDue: 1, created: 1 });
            expect(await linkFor(lateToday.id!)).not.toBeNull();
            expect(await linkFor(yesterday.id!)).toBeNull();
        });

        it("keeps an order due earlier today (location time) but before UTC's today", async () => {
            const link = await seedLink('tz-early', { enabled: true });
            // 10:00 New York on Nov 1 = Nov 1 in UTC, a day before UTC's today
            const earlierToday = squareOrder(link.squareLocationId, {
                fulfillments: [pickupAt('2026-11-01T15:00:00Z')],
            });
            searchPages = [[earlierToday]];

            const result = await importService.importLocation(
                link,
                ACTOR_USER_ID,
                now,
            );

            expect(result).toMatchObject({ pastDue: 0, created: 1 });
        });
    });

    describe('re-sync', () => {
        it('is idempotent: no duplicate orders, order items or unresolved lines', async () => {
            const link = await seedLink('resync', { enabled: true });
            searchPages = [
                [
                    squareOrder(link.squareLocationId, {
                        lineItems: [
                            {
                                uid: 'l-pie',
                                quantity: '2',
                                catalogObjectId: VAR_PIE,
                            },
                            {
                                uid: 'l-mystery',
                                quantity: '1',
                                catalogObjectId: VAR_UNMAPPED,
                            },
                            { uid: 'l-adhoc', name: 'Custom', quantity: '1' },
                        ],
                    }),
                    squareOrder(link.squareLocationId, {}),
                ],
            ];
            const counts = async () => ({
                orders: await orderRepo.count({
                    where: { tenantId: tenant.id },
                }),
                items: await orderItemRepo.count({
                    where: { parentOrder: { tenantId: tenant.id } },
                }),
                unresolved: await unresolvedRepo.count({
                    where: { tenantId: tenant.id },
                }),
                links: await orderLinkRepo.count({
                    where: { tenantId: tenant.id },
                }),
            });

            const first = await linkService.resyncForCurrentTenant(link.id);
            const afterFirst = await counts();
            const second = await linkService.resyncForCurrentTenant(link.id);

            expect(first).toMatchObject({ created: 2, unchanged: 0 });
            expect(afterFirst).toEqual({
                orders: 2,
                items: 2,
                unresolved: 2,
                links: 2,
            });
            expect(second).toMatchObject({ created: 0, unchanged: 2 });
            expect(await counts()).toEqual(afterFirst);
        });

        it('pages through every search result', async () => {
            const link = await seedLink('pages', { enabled: true });
            searchPages = [
                [squareOrder(link.squareLocationId, {})],
                [squareOrder(link.squareLocationId, {})],
            ];

            const result = await linkService.resyncForCurrentTenant(link.id);

            // Two OPEN pages, then the (empty) COMPLETED search
            expect(searchRequests.map((r) => r.cursor)).toEqual([
                undefined,
                '1',
                undefined,
            ]);
            expect(result).toMatchObject({ found: 2, created: 2 });
        });

        it('imports a recently completed order that is still due, searching completed orders closed within the lookback', async () => {
            const now = new Date('2026-11-02T12:00:00Z');
            const link = await seedLink('completed', { enabled: true });
            const completedEarly = squareOrder(link.squareLocationId, {
                state: 'COMPLETED',
                fulfillments: [pickupAt('2026-11-04T15:00:00Z')],
            });
            completedPages = [[completedEarly]];

            const result = await importService.importLocation(
                link,
                ACTOR_USER_ID,
                now,
            );

            expect(result).toMatchObject({ found: 1, created: 1 });
            expect(await linkFor(completedEarly.id!)).not.toBeNull();
            expect(searchRequests[1].query).toEqual({
                filter: {
                    stateFilter: { states: ['COMPLETED'] },
                    fulfillmentFilter: {
                        fulfillmentTypes: ['PICKUP', 'DELIVERY'],
                    },
                    dateTimeFilter: {
                        closedAt: {
                            startAt: new Date(
                                now.getTime() -
                                    SQUARE_IMPORT_COMPLETED_LOOKBACK_DAYS *
                                        DAY_MS,
                            ).toISOString(),
                        },
                    },
                },
                sort: { sortField: 'CLOSED_AT', sortOrder: 'DESC' },
            });
        });

        it('carries on past an order Petsi rejects', async () => {
            const link = await seedLink('rejected', { enabled: true });
            const noRecipient = squareOrder(link.squareLocationId, {
                fulfillments: [
                    {
                        type: 'PICKUP',
                        pickupDetails: {
                            pickupAt: new Date(
                                Date.now() + DAY_MS,
                            ).toISOString(),
                        },
                    },
                ],
            });
            const good = squareOrder(link.squareLocationId, {});
            searchPages = [[noRecipient, good]];

            const result = await linkService.resyncForCurrentTenant(link.id);

            expect(result).toMatchObject({ rejected: 1, created: 1 });
            expect(await linkFor(noRecipient.id!)).toBeNull();
            expect(await linkFor(good.id!)).not.toBeNull();
            expect(
                await issueRepo.findOneBy({
                    tenantId: tenant.id,
                    squareOrderId: noRecipient.id!,
                }),
            ).toMatchObject({ reason: 'validation_failed', status: 'open' });

            // The next re-sync retries it, and Square now has the recipient
            searchPages = [
                [
                    {
                        ...noRecipient,
                        version: 2,
                        fulfillments: good.fulfillments,
                    },
                ],
            ];
            const retried = await linkService.resyncForCurrentTenant(link.id);
            expect(retried).toMatchObject({ rejected: 0, created: 1 });
            expect(
                await issueRepo.findOneBy({
                    tenantId: tenant.id,
                    squareOrderId: noRecipient.id!,
                }),
            ).toMatchObject({ status: 'resolved' });
        });

        it('rejects re-syncing a disabled link', async () => {
            const link = await seedLink('resync-disabled');
            const err: unknown = await linkService
                .resyncForCurrentTenant(link.id)
                .catch((e: unknown) => e);
            expect(err).toBeInstanceOf(ValidationException);
            expect((err as ValidationException).errors).toMatchObject({
                errorPayload: [
                    { errorCode: 'INCONSISTENT_STATE', fields: ['enabled'] },
                ],
            });
            expect(searchRequests).toEqual([]);
        });
    });
});
