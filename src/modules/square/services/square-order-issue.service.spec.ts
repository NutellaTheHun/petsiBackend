import { NotFoundException } from '@nestjs/common';
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
import { Order } from '../../orders/entities/order.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { SquareClientFactory } from '../client/square-client.factory';
import { SquareConnection } from '../entities/square-connection.entity';
import { SquareLocationLink } from '../entities/square-location-link.entity';
import { SquareOrderIssue } from '../entities/square-order-issue.entity';
import { SquareOrderLink } from '../entities/square-order-link.entity';
import { SquareUnresolvedLine } from '../entities/square-unresolved-line.entity';
import { SquareVariationLink } from '../entities/square-variation-link.entity';
import { FakeSquareClientFactory } from '../utils/fake-square-client.factory';
import { SquareTestUtil } from '../utils/square-test.util';
import { getSquareTestingModule } from '../utils/square-testing.module';
import { SquareOrderIngestService } from './square-order-ingest.service';
import { SquareOrderIssueService } from './square-order-issue.service';

const P = `t${Date.now()}`;

const SQ_LOCATION = `${P}-sq-loc`;
const VAR_PIE = `${P}-var-pie`;
const ACTOR_USER_ID = 7;

// ─── Square fixtures (recipient fake, no tenders) ───────────────────────────

const pickup = (withName: boolean): Square.Fulfillment => ({
    type: 'PICKUP',
    pickupDetails: {
        pickupAt: '2026-11-02T15:00:00Z',
        recipient: withName
            ? { displayName: 'Jane Doe', phoneNumber: '555-0100' }
            : { phoneNumber: '555-0100' },
    },
});

let orderSeq = 0;
const squareOrder = (overrides: Partial<Square.Order> = {}): Square.Order => ({
    id: `${P}-order-${++orderSeq}`,
    locationId: SQ_LOCATION,
    state: 'OPEN',
    version: 1,
    fulfillments: [pickup(true)],
    lineItems: [
        { uid: 'l-pie', quantity: '1', name: 'Pie', catalogObjectId: VAR_PIE },
    ],
    ...overrides,
});

describe('SquareOrderIssueService', () => {
    let module: TestingModule;
    let issueService: SquareOrderIssueService;
    let ingestService: SquareOrderIngestService;
    let requestContext: TestRequestContextService;
    let fake: FakeSquareClientFactory;
    let issueRepo: Repository<SquareOrderIssue>;
    let orderRepo: Repository<Order>;
    let orderLinkRepo: Repository<SquareOrderLink>;
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
    let otherLocation: Location;
    let connection: SquareConnection;

    /** Records a `validation_failed` issue the way a webhook would. */
    async function seedRejectedOrder(): Promise<{
        order: Square.Order;
        issue: SquareOrderIssue;
    }> {
        const order = squareOrder({ fulfillments: [pickup(false)] });
        const result = await ingestService.ingest(connection, order);
        if (result.outcome !== 'rejected') throw new Error(result.outcome);
        const issue = await issueRepo.findOneByOrFail({ id: result.issueId });
        return { order, issue };
    }

    /** Square now returns the order with a recipient name. */
    const squareReturnsFixed = (order: Square.Order) => {
        const get = jest.fn((req: Square.GetOrdersRequest) =>
            Promise.resolve({
                order: {
                    ...order,
                    id: req.orderId,
                    version: 2,
                    fulfillments: [pickup(true)],
                },
            }),
        );
        fake.tenantApi.orders.get = get;
        return get;
    };

    beforeAll(async () => {
        module = await getSquareTestingModule();
        issueService = module.get(SquareOrderIssueService);
        ingestService = module.get(SquareOrderIngestService);
        requestContext = module.get(RequestContextService);
        fake = module.get(SquareClientFactory);
        issueRepo = module.get(getRepositoryToken(SquareOrderIssue));
        orderRepo = module.get(getRepositoryToken(Order));
        orderLinkRepo = module.get(getRepositoryToken(SquareOrderLink));
        unresolvedRepo = module.get(getRepositoryToken(SquareUnresolvedLine));
        locationLinkRepo = module.get(getRepositoryToken(SquareLocationLink));
        variationRepo = module.get(getRepositoryToken(SquareVariationLink));
        connectionRepo = module.get(getRepositoryToken(SquareConnection));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
        locationRepo = module.get(getRepositoryToken(Location));
        tenantRepo = module.get(getRepositoryToken(Tenant));

        ({
            tenant,
            locations: [location, otherLocation],
        } = await module.get(LocationTestUtil).seedLocations(P, undefined, 2));
        const large = await sizeRepo.save({
            tenantId: tenant.id,
            name: `${P} Large`,
        });
        const pie = await menuItemRepo.save(
            menuItemRepo.create({
                tenantId: tenant.id,
                name: `${P} Pie`,
                type: MENU_ITEM_TYPES.SINGLE,
                sizes: [large],
            }),
        );
        connection = await module
            .get(SquareTestUtil)
            .seedConnection(P, tenant.id);
        await locationLinkRepo.save({
            tenantId: tenant.id,
            squareLocationId: SQ_LOCATION,
            squareName: `${P} Main`,
            enabled: true,
            locationId: location.id,
        });
        await variationRepo.save({
            tenantId: tenant.id,
            squareVariationId: VAR_PIE,
            squareItemId: `${P}-item-pie`,
            squareItemName: 'Pie',
            squareVariationName: 'Large',
            menuItemId: pie.id,
            menuItemSizeId: large.id,
        });
    });

    afterAll(async () => {
        await variationRepo.delete({ tenantId: tenant.id });
        await locationLinkRepo.delete({ tenantId: tenant.id });
        await connectionRepo.delete({ tenantId: tenant.id });
        await menuItemRepo.delete({ tenantId: tenant.id });
        await sizeRepo.delete({ tenantId: tenant.id });
        await locationRepo.delete({ tenantId: tenant.id });
        await tenantRepo.delete(tenant.id);
        await module.close();
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
        fake.reset();
        // Ingest runs without a request context; the service calls run as a
        // manager at `location` (RoleGuard has already authorized the route)
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
        await testCtx.executeCleanupFunctions();
    });

    const asManager = () =>
        requestContext.setContext({
            tenantId: tenant.id,
            isTenantAdmin: false,
            userId: ACTOR_USER_ID,
            locations: [{ locationId: location.id, roles: ['manager'] }],
        });

    describe('list', () => {
        it("lists the location's open issues, not resolved ones or another location's", async () => {
            const { issue } = await seedRejectedOrder();
            const resolved = await seedRejectedOrder();
            await issueRepo.update(resolved.issue.id, { status: 'resolved' });
            asManager();

            const open = await issueService.findAllForCurrentTenant(
                location.id,
                'open',
            );
            expect(open.map((i) => i.id)).toEqual([issue.id]);
            expect(open[0]).toMatchObject({
                squareOrderId: issue.squareOrderId,
                reason: 'validation_failed',
                status: 'open',
                orderId: null,
                squareVersion: '1',
            });
            expect(
                (
                    await issueService.findAllForCurrentTenant(
                        location.id,
                        'resolved',
                    )
                ).map((i) => i.id),
            ).toEqual([resolved.issue.id]);
            expect(
                await issueService.findAllForCurrentTenant(
                    otherLocation.id,
                    'open',
                ),
            ).toEqual([]);
        });
    });

    describe('retry', () => {
        it('re-fetches the order and imports it as the caller, resolving the issue', async () => {
            const { order, issue } = await seedRejectedOrder();
            const get = squareReturnsFixed(order);
            asManager();

            const dto = await issueService.retryForCurrentTenant(
                location.id,
                issue.id,
            );

            expect(get).toHaveBeenCalledWith({ orderId: order.id });
            expect(dto).toMatchObject({
                status: 'resolved',
                squareVersion: '2',
            });
            const link = await orderLinkRepo.findOneByOrFail({
                tenantId: tenant.id,
                squareOrderId: order.id!,
            });
            expect(dto.orderId).toBe(link.orderId);
        });

        it('keeps the issue open when the order is still rejected', async () => {
            const { order, issue } = await seedRejectedOrder();
            fake.tenantApi.orders.get = () =>
                Promise.resolve({ order: { ...order, version: 2 } });
            asManager();

            const dto = await issueService.retryForCurrentTenant(
                location.id,
                issue.id,
            );

            expect(dto).toMatchObject({ status: 'open', squareVersion: '2' });
            expect(dto.lastAttemptAt.getTime()).toBeGreaterThanOrEqual(
                issue.lastAttemptAt.getTime(),
            );
        });

        it('rejects retrying an issue that is not open', async () => {
            const { issue } = await seedRejectedOrder();
            await issueRepo.update(issue.id, { status: 'dismissed' });
            asManager();

            const err: unknown = await issueService
                .retryForCurrentTenant(location.id, issue.id)
                .catch((e: unknown) => e);

            expect(err).toBeInstanceOf(ValidationException);
            expect((err as ValidationException).errors).toMatchObject({
                errorPayload: [
                    { errorCode: 'INCONSISTENT_STATE', fields: ['status'] },
                ],
            });
        });
    });

    describe('dismiss', () => {
        it('dismisses an open issue, and a later rejection keeps it dismissed', async () => {
            const { order, issue } = await seedRejectedOrder();
            asManager();

            const dto = await issueService.dismissForCurrentTenant(
                location.id,
                issue.id,
            );
            expect(dto.status).toBe('dismissed');

            await ingestService.ingest(connection, { ...order, version: 2 });
            expect(
                await issueRepo.findOneByOrFail({ id: issue.id }),
            ).toMatchObject({ status: 'dismissed', squareVersion: '2' });
        });

        it('rejects dismissing a resolved issue', async () => {
            const { issue } = await seedRejectedOrder();
            await issueRepo.update(issue.id, { status: 'resolved' });
            asManager();

            await expect(
                issueService.dismissForCurrentTenant(location.id, issue.id),
            ).rejects.toThrow(ValidationException);
        });
    });

    describe('scoping', () => {
        it('404s for an issue at another location or a missing id', async () => {
            const { issue } = await seedRejectedOrder();
            asManager();

            await expect(
                issueService.dismissForCurrentTenant(
                    otherLocation.id,
                    issue.id,
                ),
            ).rejects.toThrow(NotFoundException);
            await expect(
                issueService.retryForCurrentTenant(location.id, 9_999_999),
            ).rejects.toThrow(NotFoundException);
            expect(
                (await issueRepo.findOneByOrFail({ id: issue.id })).status,
            ).toBe('open');
        });
    });
});
