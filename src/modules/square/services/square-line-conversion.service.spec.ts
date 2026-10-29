import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Square } from 'square';
import { Repository } from 'typeorm';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { Location } from '../../locations/entities/location.entity';
import { LocationTestUtil } from '../../locations/utils/location-test.util';
import { MenuItemContainerItem } from '../../menu-items/entities/menu-item-container-item.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { UpdateOrderDto } from '../../orders/dto/order/update-order.dto';
import { Order } from '../../orders/entities/order.entity';
import { OrderService } from '../../orders/services/order.service';
import { plainToInstance } from 'class-transformer';
import { RequestContextService } from '../../request-context/RequestContextService';
import { RevisionHistoryService } from '../../revision-history/revision-history.service';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { SquareConnection } from '../entities/square-connection.entity';
import { SquareItemHint } from '../entities/square-item-hint.entity';
import { SquareLocationLink } from '../entities/square-location-link.entity';
import { SquareModifierLink } from '../entities/square-modifier-link.entity';
import { SquareOrderIssue } from '../entities/square-order-issue.entity';
import { SquareOrderLink } from '../entities/square-order-link.entity';
import { SquareSizeAlias } from '../entities/square-size-alias.entity';
import { SquareUnresolvedLine } from '../entities/square-unresolved-line.entity';
import { SquareVariationLink } from '../entities/square-variation-link.entity';
import { SquareTestUtil } from '../utils/square-test.util';
import { getSquareTestingModule } from '../utils/square-testing.module';
import { SquareCatalogMappingService } from './square-catalog-mapping.service';
import { SquareOrderIngestService } from './square-order-ingest.service';
import { SquareOrderIssueService } from './square-order-issue.service';
import { SquareUnresolvedLineService } from './square-unresolved-line.service';

const P = `t${Date.now()}`;

const SQ_LOCATION = `${P}-sq-loc`;
const VAR_PIE = `${P}-var-pie`;
const VAR_NEW = `${P}-var-new`;
const VAR_BOX = `${P}-var-box`;
const MOD_CHOC = `${P}-mod-choc`;
const MOD_LEMON = `${P}-mod-lemon`;
const MOD_NEW = `${P}-mod-new`;
const MANAGER_ID = 77;

// ─── Square fixtures (recipients fake, tenders stripped) ────────────────────

const line = (
    uid: string,
    catalogObjectId: string | undefined,
    quantity = '1',
    modifiers: [string, string][] = [],
): Square.OrderLineItem => ({
    uid,
    name: catalogObjectId ?? 'Custom cake',
    variationName: 'Large',
    quantity,
    catalogObjectId,
    basePriceMoney: { amount: 1250n, currency: 'USD' },
    modifiers: modifiers.map(([id, modQuantity], i) => ({
        uid: `${uid}-m${i}`,
        catalogObjectId: id,
        name: id,
        quantity: modQuantity,
    })),
});

let orderSeq = 0;

const squareOrder = (
    lineItems: Square.OrderLineItem[],
    version = 1,
    id = `${P}-order-${++orderSeq}`,
): Square.Order => ({
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
                recipient: { displayName: 'Jane Doe', phoneNumber: '555-0100' },
            },
        },
    ],
    lineItems,
});

describe('SquareLineConversionService (pending-line conversion and resolution)', () => {
    let module: TestingModule;
    let ingestService: SquareOrderIngestService;
    let mappingService: SquareCatalogMappingService;
    let lineService: SquareUnresolvedLineService;
    let issueService: SquareOrderIssueService;
    let orderService: OrderService;
    let requestContext: TestRequestContextService;
    let orderRepo: Repository<Order>;
    let orderLinkRepo: Repository<SquareOrderLink>;
    let unresolvedRepo: Repository<SquareUnresolvedLine>;
    let issueRepo: Repository<SquareOrderIssue>;
    let locationLinkRepo: Repository<SquareLocationLink>;
    let variationRepo: Repository<SquareVariationLink>;
    let modifierRepo: Repository<SquareModifierLink>;
    let hintRepo: Repository<SquareItemHint>;
    let aliasRepo: Repository<SquareSizeAlias>;
    let connectionRepo: Repository<SquareConnection>;
    let menuItemRepo: Repository<MenuItem>;
    let containerItemRepo: Repository<MenuItemContainerItem>;
    let sizeRepo: Repository<MenuItemSize>;
    let locationRepo: Repository<Location>;
    let tenantRepo: Repository<Tenant>;
    let testCtx: DatabaseTestContext;

    let tenant: Tenant;
    let location: Location;
    let connection: SquareConnection;
    let large: MenuItemSize;
    let each: MenuItemSize;
    let boxSize: MenuItemSize;
    let applePie: MenuItem;
    let cherryPie: MenuItem;
    let chocChip: MenuItem;
    let lemon: MenuItem;
    let boxOf6: MenuItem;

    /** A manager resolving lines (the services read the tenant and user from the context). */
    const asManager = <T>(fn: () => Promise<T>) =>
        requestContext.runWithContext(
            { tenantId: tenant.id, isTenantAdmin: true, userId: MANAGER_ID },
            fn,
        );

    const ingest = (order: Square.Order) =>
        ingestService.ingest(connection, order);

    /** Ingests the order and returns its Petsi order id. */
    const imported = async (order: Square.Order): Promise<number> => {
        const result = await ingest(order);
        if (result.outcome !== 'created' && result.outcome !== 'updated') {
            throw new Error(`not imported: ${result.outcome}`);
        }
        return result.orderId;
    };

    const lineOf = (squareOrderId: string, uid: string) =>
        unresolvedRepo.findOneOrFail({
            where: { tenantId: tenant.id, squareOrderId, squareLineUid: uid },
        });

    const itemsOf = async (orderId: number) =>
        (
            await orderRepo.findOneOrFail({
                where: { id: orderId },
                relations: [
                    'orderedItems',
                    'orderedItems.menuItem',
                    'orderedItems.containerOrderMenuItems',
                    'orderedItems.containerOrderMenuItems.containedMenuItem',
                ],
            })
        ).orderedItems
            .map((item) => ({
                id: item.id,
                menuItemId: item.menuItem.id,
                quantity: item.quantity,
                contents: (item.containerOrderMenuItems ?? [])
                    .map((c) => ({
                        menuItemId: c.containedMenuItem.id,
                        quantity: c.quantity,
                    }))
                    .sort((a, b) => a.menuItemId - b.menuItemId),
            }))
            .sort((a, b) => a.menuItemId - b.menuItemId);

    const seedVariation = (
        squareVariationId: string,
        mapping: Partial<SquareVariationLink> = {},
    ) =>
        variationRepo.save(
            variationRepo.create({
                tenantId: tenant.id,
                squareVariationId,
                squareItemId: `${squareVariationId}-item`,
                squareItemName: squareVariationId,
                squareVariationName: 'Large',
                menuItemId: null,
                menuItemSizeId: null,
                ...mapping,
            }),
        );

    const setFrozen = (orderId: number, isFrozen: boolean) =>
        requestContext.runWithContext(
            { tenantId: tenant.id, isTenantAdmin: true },
            () =>
                orderService.update(
                    orderId,
                    plainToInstance(UpdateOrderDto, { isFrozen }),
                ),
        );

    beforeAll(async () => {
        module = await getSquareTestingModule();
        // Runs onModuleInit: the unfreeze listener registers there
        await module.init();
        ingestService = module.get(SquareOrderIngestService);
        mappingService = module.get(SquareCatalogMappingService);
        lineService = module.get(SquareUnresolvedLineService);
        issueService = module.get(SquareOrderIssueService);
        orderService = module.get(OrderService);
        requestContext = module.get(RequestContextService);
        orderRepo = module.get(getRepositoryToken(Order));
        orderLinkRepo = module.get(getRepositoryToken(SquareOrderLink));
        unresolvedRepo = module.get(getRepositoryToken(SquareUnresolvedLine));
        issueRepo = module.get(getRepositoryToken(SquareOrderIssue));
        locationLinkRepo = module.get(getRepositoryToken(SquareLocationLink));
        variationRepo = module.get(getRepositoryToken(SquareVariationLink));
        modifierRepo = module.get(getRepositoryToken(SquareModifierLink));
        hintRepo = module.get(getRepositoryToken(SquareItemHint));
        aliasRepo = module.get(getRepositoryToken(SquareSizeAlias));
        connectionRepo = module.get(getRepositoryToken(SquareConnection));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        containerItemRepo = module.get(
            getRepositoryToken(MenuItemContainerItem),
        );
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
        locationRepo = module.get(getRepositoryToken(Location));
        tenantRepo = module.get(getRepositoryToken(Tenant));

        const locationUtil = module.get(LocationTestUtil);
        tenant = await locationUtil.seedTenant(P);
        ({
            locations: [location],
        } = await locationUtil.seedLocations(P, tenant, 1));
        [large, each, boxSize] = await sizeRepo.save(
            ['Large', 'Each', 'Box'].map((name) => ({
                tenantId: tenant.id,
                name: `${P} ${name}`,
            })),
        );
        [applePie, cherryPie] = await menuItemRepo.save(
            [`${P} Apple Pie`, `${P} Cherry Pie`].map((name) =>
                menuItemRepo.create({
                    tenantId: tenant.id,
                    name,
                    type: MENU_ITEM_TYPES.SINGLE,
                    sizes: [large],
                }),
            ),
        );
        [chocChip, lemon] = await menuItemRepo.save(
            [`${P} Chocolate Chip`, `${P} Lemon`].map((name) =>
                menuItemRepo.create({
                    tenantId: tenant.id,
                    name,
                    type: MENU_ITEM_TYPES.SINGLE,
                    sizes: [each],
                }),
            ),
        );
        boxOf6 = await menuItemRepo.save(
            menuItemRepo.create({
                tenantId: tenant.id,
                name: `${P} Box of 6`,
                type: MENU_ITEM_TYPES.CONTAINER,
                variableMaxAmount: 6,
                sizes: [boxSize],
                // Lemon is added by the retry test
                containerMenuItems: [
                    {
                        tenantId: tenant.id,
                        parentItemSize: boxSize,
                        containedMenuItem: chocChip,
                        containedItemSize: each,
                        quantity: 1,
                    },
                ],
            }),
        );

        connection = await module
            .get(SquareTestUtil)
            .seedConnection(P, tenant.id);
        await locationLinkRepo.save({
            tenantId: tenant.id,
            squareLocationId: SQ_LOCATION,
            squareName: `${P} Main`,
            timezone: 'America/New_York',
            enabled: true,
            locationId: location.id,
        });
    });

    afterAll(async () => {
        await locationLinkRepo.delete({ tenantId: tenant.id });
        await connectionRepo.delete({ tenantId: tenant.id });
        await menuItemRepo.delete({ tenantId: tenant.id });
        await sizeRepo.delete({ tenantId: tenant.id });
        await locationRepo.delete({ id: location.id });
        await tenantRepo.delete(tenant.id);
        await module.close();
    });

    beforeEach(async () => {
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
            await modifierRepo.delete({ tenantId: tenant.id });
            await variationRepo.delete({ tenantId: tenant.id });
            await aliasRepo.delete({ tenantId: tenant.id });
            await hintRepo.delete({ tenantId: tenant.id });
        });
        await seedVariation(VAR_PIE, {
            menuItemId: applePie.id,
            menuItemSizeId: large.id,
        });
    });

    afterEach(async () => {
        jest.restoreAllMocks();
        await testCtx.executeCleanupFunctions();
    });

    describe('conversion after a mapping change', () => {
        it('converts pending lines on active orders and leaves frozen and detached ones pending', async () => {
            const link = await seedVariation(VAR_NEW);
            const [active, frozen, detached] = [1, 2, 3].map(() =>
                squareOrder([line('l-new', VAR_NEW, '2')]),
            );
            const activeId = await imported(active);
            const frozenId = await imported(frozen);
            const detachedId = await imported(detached);
            await setFrozen(frozenId, true);
            await orderLinkRepo.update(
                { tenantId: tenant.id, squareOrderId: detached.id },
                { status: 'detached' },
            );
            const appendRevision = jest.spyOn(
                module.get(RevisionHistoryService),
                'appendRevision',
            );
            appendRevision.mockClear();

            await asManager(() =>
                mappingService.overrideVariationLinkForCurrentTenant(link.id, {
                    menuItemId: cherryPie.id,
                    menuItemSizeId: large.id,
                }),
            );

            const [converted] = await itemsOf(activeId);
            expect(converted).toMatchObject({
                menuItemId: cherryPie.id,
                quantity: 2,
            });
            expect((await lineOf(active.id!, 'l-new')).status).toBe('resolved');
            const orderLink = await orderLinkRepo.findOneByOrFail({
                tenantId: tenant.id,
                squareOrderId: active.id,
            });
            expect(orderLink.lineMap['l-new']).toEqual([converted.id]);
            // The resolving user is the revision actor
            expect(appendRevision.mock.calls[0][1]).toMatchObject({
                entityId: activeId,
                changeLog: {
                    kind: 'updated',
                    actor: { type: 'user', id: MANAGER_ID },
                },
            });

            for (const [order, id] of [
                [frozen, frozenId],
                [detached, detachedId],
            ] as const) {
                expect(await itemsOf(id)).toEqual([]);
                expect((await lineOf(order.id!, 'l-new')).status).toBe(
                    'pending',
                );
            }
        });

        it('converts a frozen order’s waiting lines when it is unfrozen', async () => {
            const link = await seedVariation(VAR_NEW);
            const order = squareOrder([line('l-new', VAR_NEW)]);
            const orderId = await imported(order);
            await setFrozen(orderId, true);
            await asManager(() =>
                mappingService.overrideVariationLinkForCurrentTenant(link.id, {
                    menuItemId: cherryPie.id,
                    menuItemSizeId: large.id,
                }),
            );
            expect((await lineOf(order.id!, 'l-new')).status).toBe('pending');

            await setFrozen(orderId, false);

            expect(await itemsOf(orderId)).toMatchObject([
                { menuItemId: cherryPie.id, quantity: 1 },
            ]);
            expect((await lineOf(order.id!, 'l-new')).status).toBe('resolved');
        });

        it('converts lines that a size alias fix now resolves', async () => {
            await hintRepo.save({
                tenantId: tenant.id,
                squareItemId: `${VAR_NEW}-item`,
                squareItemName: VAR_NEW,
                squareCategoryId: null,
                menuItemId: cherryPie.id,
            });
            const alias = await aliasRepo.save({
                tenantId: tenant.id,
                squareVariationName: 'large',
                menuItemSizeId: null,
            });
            await seedVariation(VAR_NEW);
            const order = squareOrder([line('l-new', VAR_NEW, '3')]);
            const orderId = await imported(order);
            expect((await lineOf(order.id!, 'l-new')).status).toBe('pending');

            await asManager(() =>
                mappingService.setSizeAliasForCurrentTenant(alias.id, large.id),
            );

            expect(await itemsOf(orderId)).toMatchObject([
                { menuItemId: cherryPie.id, quantity: 3 },
            ]);
            expect((await lineOf(order.id!, 'l-new')).status).toBe('resolved');
        });

        it('converts box lines once their modifier is mapped', async () => {
            await seedVariation(VAR_BOX, {
                menuItemId: boxOf6.id,
                menuItemSizeId: boxSize.id,
                modifierMode: 'container_contents',
            });
            const modifier = await modifierRepo.save(
                modifierRepo.create({
                    tenantId: tenant.id,
                    squareModifierId: MOD_NEW,
                    squareModifierListId: `${MOD_NEW}-list`,
                    squareModifierListName: 'Flavor',
                    squareModifierName: 'Chocolate Chip',
                    squareItemIds: [`${VAR_BOX}-item`],
                    menuItemId: null,
                    menuItemSizeId: null,
                }),
            );
            const order = squareOrder([
                line('l-box', VAR_BOX, '1', [[MOD_NEW, '6']]),
            ]);
            const orderId = await imported(order);
            expect((await lineOf(order.id!, 'l-box')).reason).toBe(
                'unmapped_modifier',
            );

            await asManager(() =>
                mappingService.setModifierMappingForCurrentTenant(modifier.id, {
                    kind: 'item',
                    menuItemId: chocChip.id,
                    menuItemSizeId: each.id,
                }),
            );

            expect(await itemsOf(orderId)).toMatchObject([
                {
                    menuItemId: boxOf6.id,
                    quantity: 1,
                    contents: [{ menuItemId: chocChip.id, quantity: 6 }],
                },
            ]);
            expect((await lineOf(order.id!, 'l-box')).status).toBe('resolved');
        });

        it('records an issue for an order that fails and still converts the others', async () => {
            const link = await seedVariation(VAR_NEW);
            // Mapping VAR_NEW to Apple Pie duplicates this order's pie line
            const failing = squareOrder([
                line('l-pie', VAR_PIE),
                line('l-new', VAR_NEW),
            ]);
            const passing = squareOrder([line('l-new', VAR_NEW)]);
            const failingId = await imported(failing);
            const passingId = await imported(passing);

            await asManager(() =>
                mappingService.overrideVariationLinkForCurrentTenant(link.id, {
                    menuItemId: applePie.id,
                    menuItemSizeId: large.id,
                }),
            );

            const failedLine = await lineOf(failing.id!, 'l-new');
            expect(failedLine.status).toBe('pending');
            expect(await itemsOf(failingId)).toHaveLength(1);
            const issue = await issueRepo.findOneByOrFail({
                tenantId: tenant.id,
                squareOrderId: failing.id,
            });
            expect(issue).toMatchObject({
                status: 'open',
                reason: 'validation_failed',
                orderId: failingId,
                locationId: location.id,
            });
            expect(issue.detail?.unresolvedLineIds).toEqual([failedLine.id]);
            expect(issue.detail?.validationErrors).toBeDefined();

            expect(await itemsOf(passingId)).toMatchObject([
                { menuItemId: applePie.id },
            ]);
            expect((await lineOf(passing.id!, 'l-new')).status).toBe(
                'resolved',
            );

            // Fixing the mapping and retrying the issue converts the line
            await variationRepo.update(
                { id: link.id },
                { menuItemId: cherryPie.id },
            );
            const retried = await asManager(() =>
                issueService.retryForCurrentTenant(location.id, issue.id),
            );
            expect(retried.status).toBe('resolved');
            expect((await lineOf(failing.id!, 'l-new')).status).toBe(
                'resolved',
            );
        });
    });

    describe('resolution actions', () => {
        it('groups pending lines by Square product, with ad-hoc lines on their own', async () => {
            const link = await seedVariation(VAR_NEW);
            const first = squareOrder([
                line('l-new', VAR_NEW),
                line('l-adhoc', undefined),
            ]);
            const second = squareOrder([line('l-new', VAR_NEW, '2')]);
            await imported(first);
            await imported(second);

            const groups = await asManager(() =>
                lineService.findGroupsForCurrentTenant(location.id),
            );

            expect(groups).toHaveLength(2);
            const variationGroup = groups.find(
                (g) => g.squareVariationId === VAR_NEW,
            )!;
            expect(variationGroup).toMatchObject({
                key: `unmapped_variation:${VAR_NEW}`,
                variationLinkId: link.id,
            });
            expect(variationGroup.lines.map((l) => l.squareOrderId)).toEqual([
                first.id,
                second.id,
            ]);
            const adHocGroup = groups.find((g) => g.reason === 'ad_hoc')!;
            expect(adHocGroup.variationLinkId).toBeNull();
            expect(adHocGroup.lines).toHaveLength(1);
        });

        it('maps an ad-hoc line, and later Square updates keep it placed', async () => {
            const order = squareOrder([line('l-adhoc', undefined, '3')]);
            const orderId = await imported(order);
            const pending = await lineOf(order.id!, 'l-adhoc');

            const mapped = await asManager(() =>
                lineService.mapAdHocForCurrentTenant(location.id, pending.id, {
                    menuItemId: cherryPie.id,
                    menuItemSizeId: large.id,
                }),
            );

            expect(mapped).toMatchObject({
                status: 'resolved',
                adHocMenuItemId: cherryPie.id,
            });
            const [item] = await itemsOf(orderId);
            expect(item).toMatchObject({
                menuItemId: cherryPie.id,
                quantity: 3,
            });

            await ingest(
                squareOrder([line('l-adhoc', undefined, '4')], 2, order.id),
            );
            expect(await itemsOf(orderId)).toMatchObject([
                { id: item.id, menuItemId: cherryPie.id, quantity: 4 },
            ]);
            expect((await lineOf(order.id!, 'l-adhoc')).status).toBe(
                'resolved',
            );
        });

        it('rejects an ad-hoc mapping to a size the menu item does not offer', async () => {
            const order = squareOrder([line('l-adhoc', undefined)]);
            await imported(order);
            const pending = await lineOf(order.id!, 'l-adhoc');

            await expect(
                asManager(() =>
                    lineService.mapAdHocForCurrentTenant(
                        location.id,
                        pending.id,
                        { menuItemId: cherryPie.id, menuItemSizeId: each.id },
                    ),
                ),
            ).rejects.toThrow(ValidationException);
            expect((await lineOf(order.id!, 'l-adhoc')).status).toBe('pending');
        });

        it('dismisses a line without changing the order', async () => {
            await seedVariation(VAR_NEW);
            const order = squareOrder([line('l-new', VAR_NEW)]);
            const orderId = await imported(order);
            const pending = await lineOf(order.id!, 'l-new');

            const dismissed = await asManager(() =>
                lineService.dismissForCurrentTenant(location.id, pending.id),
            );

            expect(dismissed.status).toBe('dismissed');
            expect(await itemsOf(orderId)).toEqual([]);
        });

        it('disables a variation and dismisses all its pending lines', async () => {
            const link = await seedVariation(VAR_NEW);
            const first = squareOrder([line('l-new', VAR_NEW)]);
            const second = squareOrder([line('l-new', VAR_NEW)]);
            await imported(first);
            await imported(second);
            const pending = await lineOf(first.id!, 'l-new');

            await asManager(() =>
                lineService.disableVariationForCurrentTenant(
                    location.id,
                    pending.id,
                ),
            );

            expect(
                await variationRepo.findOneByOrFail({ id: link.id }),
            ).toMatchObject({
                enabled: false,
                mappingSource: 'manual',
            });
            for (const order of [first, second]) {
                expect((await lineOf(order.id!, 'l-new')).status).toBe(
                    'dismissed',
                );
            }
        });

        it('retries a box line after the box is fixed in Petsi', async () => {
            await seedVariation(VAR_BOX, {
                menuItemId: boxOf6.id,
                menuItemSizeId: boxSize.id,
                modifierMode: 'container_contents',
            });
            await modifierRepo.save(
                (
                    [
                        [MOD_CHOC, chocChip],
                        [MOD_LEMON, lemon],
                    ] as [string, MenuItem][]
                ).map(([squareModifierId, item]) =>
                    modifierRepo.create({
                        tenantId: tenant.id,
                        squareModifierId,
                        squareModifierListId: `${squareModifierId}-list`,
                        squareModifierListName: 'Flavor',
                        squareModifierName: squareModifierId,
                        squareItemIds: [`${VAR_BOX}-item`],
                        menuItemId: item.id,
                        menuItemSizeId: each.id,
                    }),
                ),
            );
            const order = squareOrder([
                line('l-box', VAR_BOX, '1', [
                    [MOD_CHOC, '3'],
                    [MOD_LEMON, '3'],
                ]),
            ]);
            const orderId = await imported(order);
            const pending = await lineOf(order.id!, 'l-box');
            expect(pending.reason).toBe('container_invalid');

            // Lemon isn't allowed in the box yet: still pending
            expect(
                await asManager(() =>
                    lineService.retryForCurrentTenant(location.id, pending.id),
                ),
            ).toMatchObject({ status: 'pending' });

            const allowLemon = await containerItemRepo.save({
                tenantId: tenant.id,
                parentMenuItem: boxOf6,
                parentItemSize: boxSize,
                containedMenuItem: lemon,
                containedItemSize: each,
                quantity: 1,
            });
            testCtx.addCleanupFunction(() =>
                containerItemRepo.delete(allowLemon.id).then(() => undefined),
            );

            const retried = await asManager(() =>
                lineService.retryForCurrentTenant(location.id, pending.id),
            );

            expect(retried.status).toBe('resolved');
            expect(await itemsOf(orderId)).toMatchObject([
                {
                    menuItemId: boxOf6.id,
                    contents: [
                        { menuItemId: chocChip.id, quantity: 3 },
                        { menuItemId: lemon.id, quantity: 3 },
                    ].sort((a, b) => a.menuItemId - b.menuItemId),
                },
            ]);
        });

        it('404s for a line at another location', async () => {
            await seedVariation(VAR_NEW);
            const order = squareOrder([line('l-new', VAR_NEW)]);
            await imported(order);
            const pending = await lineOf(order.id!, 'l-new');

            await expect(
                asManager(() =>
                    lineService.dismissForCurrentTenant(9_999_999, pending.id),
                ),
            ).rejects.toThrow('Not Found');
        });
    });
});
