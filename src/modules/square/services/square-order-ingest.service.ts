import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Square } from 'square';
import { EntityManager, In, IsNull, Not, Repository } from 'typeorm';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { NestedCreateOrderContainerItemDto } from '../../orders/dto/order-container-item/nested-create-order-container-item.dto';
import { NestedUpdateOrderContainerItemDto } from '../../orders/dto/order-container-item/nested-update-order-container-item.dto';
import { NestedCreateOrderMenuItemDto } from '../../orders/dto/order-menu-item/nested-create-order-menu-item.dto';
import { NestedUpdateOrderMenuItemDto } from '../../orders/dto/order-menu-item/nested-update-order-menu-item.dto';
import { CreateOrderDto } from '../../orders/dto/order/create-order.dto';
import { UpdateOrderDto } from '../../orders/dto/order/update-order.dto';
import { OrderMenuItem } from '../../orders/entities/order-menu-item.entity';
import { Order } from '../../orders/entities/order.entity';
import { OrderService } from '../../orders/services/order.service';
import { ORDER_STATUSES } from '../../orders/utils/order-statuses';
import { orderMenuItemToNestedUpdateDto } from '../../orders/utils/entity-transformers/order-menu-item.dto.transformer';
import { ValidationException } from '../../../common/validation/validation-exception';
import { RequestContextService } from '../../request-context/RequestContextService';
import { SquareConnection } from '../entities/square-connection.entity';
import { SquareLocationLink } from '../entities/square-location-link.entity';
import { SquareModifierLink } from '../entities/square-modifier-link.entity';
import {
    SquareOrderLineMap,
    SquareOrderLink,
} from '../entities/square-order-link.entity';
import {
    SQUARE_RETRYABLE_ISSUE_REASONS,
    SquareOrderIssue,
    SquareOrderIssueDetail,
} from '../entities/square-order-issue.entity';
import { SquareUnresolvedLine } from '../entities/square-unresolved-line.entity';
import { SquareVariationLink } from '../entities/square-variation-link.entity';
import {
    isSquareOrderCancelled,
    mapSquareOrder,
    squareOrderSkipReason,
    squareRefundSummary,
    PlannedContainerItem,
    PlannedOrderFields,
    PlannedSquareLine,
    SquareOrderContainerDefinition,
    SquareOrderMapping,
    SquareOrderModifierMapping,
    SquareOrderPlan,
    SquareOrderSkipReason,
    SquareOrderVariationMapping,
    SquareAdHocMapping,
} from '../utils/square-order-mapper';

export type SquareIngestSkipReason =
    | SquareOrderSkipReason
    | 'location_not_enabled'
    | 'detached';

export type SquareIngestResult =
    | { outcome: 'skipped'; reason: SquareIngestSkipReason }
    | { outcome: 'stale' }
    | { outcome: 'created' | 'updated'; orderId: number }
    | {
          /** Square cancelled it; the Petsi order (if any) is now CANCELLED. */
          outcome: 'cancelled';
          orderId: number | null;
      }
    | {
          /** Square cancelled a detached order: recorded as an issue only. */
          outcome: 'flagged';
          reason: 'cancelled_while_detached';
          issueId: number;
      }
    | {
          /** Recorded as an order issue; no order was created or changed. */
          outcome: 'rejected';
          reason: 'validation_failed' | 'location_unmapped';
          issueId: number;
      };

export const ORDER_LINE_RELATIONS = [
    'orderedItems',
    'orderedItems.menuItem',
    'orderedItems.size',
    'orderedItems.containerOrderMenuItems',
    'orderedItems.containerOrderMenuItems.containedMenuItem',
    'orderedItems.containerOrderMenuItems.containedItemSize',
];

export function lineKey(menuItemId: number, sizeId: number | null | undefined) {
    return `${menuItemId}:${sizeId ?? ''}`;
}

/** Nested create DTOs for a container's planned contents. */
function containerItemCreateDtos(
    createIdPrefix: string,
    line: PlannedSquareLine,
    contents: PlannedContainerItem[],
): NestedCreateOrderContainerItemDto[] {
    return contents.map((item) =>
        plainToInstance(NestedCreateOrderContainerItemDto, {
            createId: `${createIdPrefix}/${lineKey(item.menuItemId, item.menuItemSizeId)}`,
            containedMenuItemId: item.menuItemId,
            containedItemSizeId: item.menuItemSizeId,
            quantity: item.quantity,
            parentMenuItemIdCtx: line.menuItemId,
            parentMenuItemSizeIdCtx: line.menuItemSizeId,
        }),
    );
}

/** Unique per order: a Square line can plan one item per menu item and size. */
function lineCreateId(line: PlannedSquareLine): string {
    return `${line.squareLineUid}/${lineKey(line.menuItemId, line.menuItemSizeId)}`;
}

/** A nested create DTO for a planned line, with its container contents. */
export function squareLineCreateDto(
    line: PlannedSquareLine,
): NestedCreateOrderMenuItemDto {
    const createId = lineCreateId(line);
    return plainToInstance(NestedCreateOrderMenuItemDto, {
        createId,
        menuItemId: line.menuItemId,
        sizeId: line.menuItemSizeId,
        quantity: line.quantity,
        containerOrderMenuItems: containerItemCreateDtos(
            createId,
            line,
            line.containerItems,
        ),
    });
}

/** Staff's ad-hoc mappings on unresolved rows, by line uid. */
export function adHocMappingsOf(
    rows: SquareUnresolvedLine[],
): Map<string, SquareAdHocMapping> {
    const result = new Map<string, SquareAdHocMapping>();
    for (const row of rows) {
        if (row.adHocMenuItemId != null && row.adHocMenuItemSizeId != null) {
            result.set(row.squareLineUid, {
                menuItemId: row.adHocMenuItemId,
                menuItemSizeId: row.adHocMenuItemSizeId,
            });
        }
    }
    return result;
}

/** The menu item ids a set of mappings points at, for `loadContainers`. */
export function mappedMenuItemIds(
    mappings: Iterable<{ menuItemId: number | null }>,
): number[] {
    return [
        ...new Set(
            [...mappings]
                .map((m) => m.menuItemId)
                .filter((id): id is number => id != null),
        ),
    ];
}

/**
 * The one ingest path for a full Square order, used by webhooks, the initial
 * import, re-sync and resolution. Writes go through `OrderService` as a system
 * writer: the tenant comes from the connection and the location from the
 * location link, never from the caller's request.
 *
 * An order Petsi can't accept (an `OrderService` validation rejection, or an
 * enabled location link whose Petsi location is gone) becomes a
 * `SquareOrderIssue` instead of an error, so callers still acknowledge it.
 * A later successful ingest resolves the issue.
 *
 * Not atomic across the order write and the link/unresolved-line write:
 * `OrderService` owns its own transaction.
 */
@Injectable()
export class SquareOrderIngestService {
    constructor(
        @InjectRepository(SquareLocationLink)
        private readonly locationLinkRepo: Repository<SquareLocationLink>,
        @InjectRepository(SquareOrderLink)
        private readonly orderLinkRepo: Repository<SquareOrderLink>,
        @InjectRepository(SquareOrderIssue)
        private readonly issueRepo: Repository<SquareOrderIssue>,
        @InjectRepository(SquareVariationLink)
        private readonly variationLinkRepo: Repository<SquareVariationLink>,
        @InjectRepository(SquareModifierLink)
        private readonly modifierLinkRepo: Repository<SquareModifierLink>,
        @InjectRepository(MenuItem)
        private readonly menuItemRepo: Repository<MenuItem>,
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,
        @InjectRepository(SquareUnresolvedLine)
        private readonly unresolvedLineRepo: Repository<SquareUnresolvedLine>,
        private readonly orderService: OrderService,
        private readonly requestContext: RequestContextService,
    ) {}

    /**
     * @param actorUserId the user who triggered an import, re-sync or
     * resolution (the revision actor); omitted for webhook-driven writes.
     */
    async ingest(
        connection: SquareConnection,
        squareOrder: Square.Order,
        opts: { actorUserId?: number } = {},
    ): Promise<SquareIngestResult> {
        const tenantId = connection.tenantId;
        const locationLink = await this.locationLinkRepo.findOne({
            where: { tenantId, squareLocationId: squareOrder.locationId },
        });
        if (!locationLink?.enabled) {
            return { outcome: 'skipped', reason: 'location_not_enabled' };
        }

        const existingLink = squareOrder.id
            ? await this.orderLinkRepo.findOne({
                  where: { tenantId, squareOrderId: squareOrder.id },
              })
            : null;
        // Detached orders only get the cancellation check
        if (existingLink?.status === 'detached') {
            return isSquareOrderCancelled(squareOrder)
                ? this.flagCancelledWhileDetached(squareOrder, existingLink)
                : { outcome: 'skipped', reason: 'detached' };
        }
        if (
            existingLink &&
            BigInt(existingLink.squareVersion) >=
                BigInt(squareOrder.version ?? 0)
        ) {
            return { outcome: 'stale' };
        }
        if (existingLink && isSquareOrderCancelled(squareOrder)) {
            return this.cancel(squareOrder, existingLink, opts);
        }

        const skipReason = squareOrderSkipReason(squareOrder);
        if (skipReason) {
            if (skipReason === 'cancelled') {
                // Never imported: an open rejection no longer needs anyone
                await this.resolveIssue(this.issueRepo.manager, {
                    tenantId,
                    squareOrderId: squareOrder.id!,
                    squareVersion: String(squareOrder.version ?? 0),
                    orderId: null,
                });
            }
            return { outcome: 'skipped', reason: skipReason };
        }
        // The link's Petsi location was deleted: nowhere to put the order
        if (locationLink.locationId == null) {
            return this.reject(tenantId, squareOrder, existingLink, {
                reason: 'location_unmapped',
                detail: null,
                locationId: null,
            });
        }
        const locationId = locationLink.locationId;

        const variations = await this.loadVariations(tenantId, squareOrder);
        const adHocMappings = await this.loadAdHocMappings(
            tenantId,
            squareOrder.id!,
        );
        let mapping: SquareOrderMapping;
        try {
            mapping = mapSquareOrder({
                order: squareOrder,
                variations,
                modifiers: await this.loadModifiers(tenantId, squareOrder),
                containers: await this.loadContainers(tenantId, [
                    ...mappedMenuItemIds(variations.values()),
                    ...mappedMenuItemIds(adHocMappings.values()),
                ]),
                adHocMappings,
                timezone: locationLink.timezone,
            });
        } catch (err) {
            // A whole-order problem in Square's data (no recipient, no due
            // time, a bad quantity)
            if (!(err instanceof ValidationException)) {
                throw err;
            }
            return this.reject(tenantId, squareOrder, existingLink, {
                reason: 'validation_failed',
                detail: { validationErrors: err.errors },
                locationId,
            });
        }
        if (mapping.kind === 'skip') {
            return { outcome: 'skipped', reason: mapping.reason };
        }
        const plan = mapping.plan;

        const existingOrder =
            existingLink?.orderId != null
                ? await this.orderRepo.findOne({
                      where: { id: existingLink.orderId, tenantId },
                      relations: ORDER_LINE_RELATIONS,
                  })
                : null;

        let written: { orderId: number; lineMap: SquareOrderLineMap };
        try {
            written = await this.asSystemWriter(
                tenantId,
                opts.actorUserId,
                () =>
                    existingOrder
                        ? this.updateOrder(existingOrder, existingLink!, plan)
                        : this.createOrder(connection, locationId, plan),
            );
        } catch (err) {
            if (!(err instanceof ValidationException)) {
                throw err;
            }
            // OrderService rejected it; its transaction wrote nothing
            return this.reject(tenantId, squareOrder, existingLink, {
                reason: 'validation_failed',
                detail: { validationErrors: err.errors },
                locationId,
            });
        }

        await this.orderRepo.manager.transaction(async (manager) => {
            await this.saveOrderLink(manager, {
                existing: existingLink,
                tenantId,
                plan,
                orderId: written.orderId,
                lineMap: written.lineMap,
            });
            await this.syncUnresolvedLines(manager, {
                tenantId,
                locationId: existingOrder?.locationId ?? locationId,
                orderId: written.orderId,
                plan,
            });
            await this.resolveIssue(manager, {
                tenantId,
                squareOrderId: plan.squareOrderId,
                squareVersion: plan.squareVersion,
                orderId: written.orderId,
            });
            await this.flagNewReturns(manager, {
                tenantId,
                squareOrder,
                orderId: written.orderId,
                locationId: existingOrder?.locationId ?? locationId,
            });
        });

        return {
            outcome: existingOrder ? 'updated' : 'created',
            orderId: written.orderId,
        };
    }

    /**
     * Runs `fn` as the Square system writer: the connection's tenant, any of
     * its locations, allowed to write Square-owned fields and lines.
     */
    private asSystemWriter<T>(
        tenantId: number,
        actorUserId: number | undefined,
        fn: () => Promise<T>,
    ): Promise<T> {
        return this.requestContext.runWithContext(
            {
                tenantId,
                // A system writer may write at any of the tenant's locations.
                isTenantAdmin: true,
                userId: actorUserId,
                locations: undefined,
                roles: undefined,
                // No triggering user means a webhook-driven write
                revisionActorType:
                    actorUserId == null ? 'square_webhook' : undefined,
                // May write the Square-owned fields and lines
                squareSystemWriter: true,
            },
            fn,
        );
    }

    /**
     * Square cancelled an imported order: the Petsi order becomes
     * `CANCELLED` (through `OrderService`, so it gets a revision) and its
     * pending unresolved lines are dismissed. Nothing else about the order
     * changes. An open retryable issue no longer needs anyone and is resolved.
     */
    private async cancel(
        squareOrder: Square.Order,
        link: SquareOrderLink,
        opts: { actorUserId?: number },
    ): Promise<SquareIngestResult> {
        const tenantId = link.tenantId;
        const order =
            link.orderId != null
                ? await this.orderRepo.findOne({
                      where: { id: link.orderId, tenantId },
                      select: { id: true, status: true },
                      loadEagerRelations: false,
                  })
                : null;
        if (order && order.status !== ORDER_STATUSES.CANCELLED) {
            try {
                await this.asSystemWriter(tenantId, opts.actorUserId, () =>
                    this.orderService.update(
                        order.id,
                        plainToInstance(UpdateOrderDto, {
                            status: ORDER_STATUSES.CANCELLED,
                        }),
                    ),
                );
            } catch (err) {
                if (!(err instanceof ValidationException)) {
                    throw err;
                }
                return this.reject(tenantId, squareOrder, link, {
                    reason: 'validation_failed',
                    detail: { validationErrors: err.errors },
                    locationId: null,
                });
            }
        }

        const squareVersion = String(squareOrder.version ?? 0);
        await this.orderRepo.manager.transaction(async (manager) => {
            await manager.update(
                SquareOrderLink,
                { id: link.id },
                { squareVersion },
            );
            await manager.update(
                SquareUnresolvedLine,
                {
                    tenantId,
                    squareOrderId: link.squareOrderId,
                    status: 'pending',
                },
                { status: 'dismissed' },
            );
            await this.resolveIssue(manager, {
                tenantId,
                squareOrderId: link.squareOrderId,
                squareVersion,
                orderId: order?.id ?? null,
            });
        });
        return { outcome: 'cancelled', orderId: order?.id ?? null };
    }

    /**
     * Square cancelled an order staff took over: Petsi leaves it alone and
     * records a `cancelled_while_detached` issue for staff to act on, once
     * (a repeated cancel, or an order staff already cancelled, adds nothing).
     */
    private async flagCancelledWhileDetached(
        squareOrder: Square.Order,
        link: SquareOrderLink,
    ): Promise<SquareIngestResult> {
        const tenantId = link.tenantId;
        const order =
            link.orderId != null
                ? await this.orderRepo.findOne({
                      where: { id: link.orderId, tenantId },
                      select: { id: true, status: true, locationId: true },
                      loadEagerRelations: false,
                  })
                : null;
        const existing = await this.issueRepo.findOne({
            where: { tenantId, squareOrderId: link.squareOrderId },
        });
        if (
            !order ||
            order.status === ORDER_STATUSES.CANCELLED ||
            existing?.reason === 'cancelled_while_detached'
        ) {
            return { outcome: 'skipped', reason: 'detached' };
        }
        const issue = await this.issueRepo.save(
            Object.assign(
                existing ??
                    this.issueRepo.create({
                        tenantId,
                        squareOrderId: link.squareOrderId,
                    }),
                {
                    squareLocationId: squareOrder.locationId,
                    squareVersion: String(squareOrder.version ?? 0),
                    locationId: order.locationId,
                    orderId: order.id,
                    reason: 'cancelled_while_detached',
                    detail: null,
                    status: 'open',
                    lastAttemptAt: new Date(),
                } satisfies Partial<SquareOrderIssue>,
            ),
        );
        return {
            outcome: 'flagged',
            reason: 'cancelled_while_detached',
            issueId: issue.id,
        };
    }

    /**
     * Refunds never change lines: when the order carries a return the
     * order's issue hasn't recorded yet, the issue becomes an open
     * `refund_received` with the refund summary. Staff decide (Detach, edit).
     */
    private async flagNewReturns(
        manager: EntityManager,
        args: {
            tenantId: number;
            squareOrder: Square.Order;
            orderId: number;
            locationId: number;
        },
    ): Promise<void> {
        const refund = squareRefundSummary(args.squareOrder);
        if (!refund) {
            return;
        }
        const squareOrderId = args.squareOrder.id!;
        const existing = await manager.findOne(SquareOrderIssue, {
            where: { tenantId: args.tenantId, squareOrderId },
        });
        const seen = new Set(
            existing?.reason === 'refund_received'
                ? (existing.detail?.refund?.returnUids ?? [])
                : [],
        );
        if (
            existing?.reason === 'refund_received' &&
            refund.returnUids.every((uid) => seen.has(uid))
        ) {
            return;
        }
        await manager.save(
            Object.assign(
                existing ??
                    manager.create(SquareOrderIssue, {
                        tenantId: args.tenantId,
                        squareOrderId,
                    }),
                {
                    squareLocationId: args.squareOrder.locationId,
                    squareVersion: String(args.squareOrder.version ?? 0),
                    locationId: args.locationId,
                    orderId: args.orderId,
                    reason: 'refund_received',
                    detail: { refund },
                    status: 'open',
                    lastAttemptAt: new Date(),
                } satisfies Partial<SquareOrderIssue>,
            ),
        );
    }

    /**
     * Records an in-scope order Petsi can't accept as the order's issue and
     * writes nothing else (no order, link or unresolved line). Upserts the
     * issue as open with this attempt's reason and detail; a dismissed issue
     * stays dismissed (the attempt is still recorded), like a dismissed
     * unresolved line.
     *
     * @param args.locationId the Petsi location the order would go to; an
     * already imported order's own location takes precedence.
     */
    private async reject(
        tenantId: number,
        squareOrder: Square.Order,
        existingLink: SquareOrderLink | null,
        args: {
            reason: 'validation_failed' | 'location_unmapped';
            detail: SquareOrderIssueDetail | null;
            locationId: number | null;
        },
    ): Promise<SquareIngestResult> {
        const existingOrder =
            existingLink?.orderId != null
                ? await this.orderRepo.findOne({
                      where: { id: existingLink.orderId, tenantId },
                      select: { id: true, locationId: true },
                      loadEagerRelations: false,
                  })
                : null;
        // In scope, so the id is set (squareOrderSkipReason)
        const squareOrderId = squareOrder.id!;
        const issue =
            (await this.issueRepo.findOne({
                where: { tenantId, squareOrderId },
            })) ?? this.issueRepo.create({ tenantId, squareOrderId });
        Object.assign(issue, {
            squareLocationId: squareOrder.locationId,
            squareVersion: String(squareOrder.version ?? 0),
            locationId: existingOrder?.locationId ?? args.locationId,
            orderId: existingOrder?.id ?? null,
            reason: args.reason,
            detail: args.detail,
            status: issue.status === 'dismissed' ? 'dismissed' : 'open',
            lastAttemptAt: new Date(),
        });
        const saved = await this.issueRepo.save(issue);
        return { outcome: 'rejected', reason: args.reason, issueId: saved.id };
    }

    /**
     * A successful ingest (or a cancel) resolves the order's open retryable
     * issue.
     */
    private async resolveIssue(
        manager: EntityManager,
        args: {
            tenantId: number;
            squareOrderId: string;
            squareVersion: string;
            orderId: number | null;
        },
    ): Promise<void> {
        await manager.update(
            SquareOrderIssue,
            {
                tenantId: args.tenantId,
                squareOrderId: args.squareOrderId,
                status: 'open',
                reason: In([...SQUARE_RETRYABLE_ISSUE_REASONS]),
            },
            {
                status: 'resolved',
                squareVersion: args.squareVersion,
                orderId: args.orderId,
                lastAttemptAt: new Date(),
            },
        );
    }

    private async loadVariations(
        tenantId: number,
        order: Square.Order,
    ): Promise<Map<string, SquareOrderVariationMapping>> {
        const ids = [
            ...new Set(
                (order.lineItems ?? [])
                    .map((line) => line.catalogObjectId)
                    .filter((id): id is string => !!id),
            ),
        ];
        if (!ids.length) {
            return new Map();
        }
        const links = await this.variationLinkRepo.find({
            where: { tenantId, squareVariationId: In(ids) },
        });
        return new Map(links.map((link) => [link.squareVariationId, link]));
    }

    private async loadModifiers(
        tenantId: number,
        order: Square.Order,
    ): Promise<Map<string, SquareOrderModifierMapping>> {
        const ids = [
            ...new Set(
                (order.lineItems ?? [])
                    .flatMap((line) => line.modifiers ?? [])
                    .map((modifier) => modifier.catalogObjectId)
                    .filter((id): id is string => !!id),
            ),
        ];
        if (!ids.length) {
            return new Map();
        }
        const links = await this.modifierLinkRepo.find({
            where: { tenantId, squareModifierId: In(ids) },
        });
        return new Map(links.map((link) => [link.squareModifierId, link]));
    }

    /** Staff's mappings of this order's ad-hoc lines, by line uid. */
    private async loadAdHocMappings(
        tenantId: number,
        squareOrderId: string,
    ): Promise<Map<string, SquareAdHocMapping>> {
        const rows = await this.unresolvedLineRepo.find({
            where: {
                tenantId,
                squareOrderId,
                adHocMenuItemId: Not(IsNull()),
                adHocMenuItemSizeId: Not(IsNull()),
                status: Not('dismissed'),
            },
        });
        return adHocMappingsOf(rows);
    }

    /**
     * The definitions of the container menu items among `menuItemIds`;
     * the others are left out.
     */
    async loadContainers(
        tenantId: number,
        menuItemIds: number[],
    ): Promise<Map<number, SquareOrderContainerDefinition>> {
        const ids = [...new Set(menuItemIds)];
        if (!ids.length) {
            return new Map();
        }
        const containers = await this.menuItemRepo.find({
            where: {
                tenantId,
                id: In(ids),
                type: MENU_ITEM_TYPES.CONTAINER,
            },
            relations: {
                containerMenuItems: {
                    parentItemSize: true,
                    containedMenuItem: true,
                    containedItemSize: true,
                },
            },
            loadEagerRelations: false,
        });
        return new Map(
            containers.map((container) => [
                container.id,
                {
                    variableMaxAmount: container.variableMaxAmount,
                    items: (container.containerMenuItems ?? []).map((item) => ({
                        parentSizeId: item.parentItemSize.id,
                        menuItemId: item.containedMenuItem.id,
                        menuItemSizeId: item.containedItemSize.id,
                        quantity: item.quantity,
                    })),
                },
            ]),
        );
    }

    private async createOrder(
        connection: SquareConnection,
        locationId: number,
        plan: SquareOrderPlan,
    ): Promise<{ orderId: number; lineMap: SquareOrderLineMap }> {
        const dto = plainToInstance(CreateOrderDto, {
            ...this.orderFields(plan.fields),
            // Petsi-owned after create: never touched by an update
            categoryId: connection.defaultOrderCategoryId,
            isFrozen: false,
            locationId,
            orderedItems: plan.lines.map((line) => squareLineCreateDto(line)),
        });
        const created = await this.orderService.create(dto);
        return {
            orderId: created.id,
            lineMap: await this.buildLineMap(created.id, plan.lines, new Set()),
        };
    }

    /**
     * Adds, changes or removes only the lines in the link's line map; every
     * other line was added by staff and is passed through unchanged.
     */
    private async updateOrder(
        order: Order,
        link: SquareOrderLink,
        plan: SquareOrderPlan,
    ): Promise<{ orderId: number; lineMap: SquareOrderLineMap }> {
        const squareLineIds = new Set(Object.values(link.lineMap).flat());
        const currentItems = order.orderedItems ?? [];
        const staffItems = currentItems.filter(
            (item) => !squareLineIds.has(item.id),
        );
        const itemsById = new Map(currentItems.map((item) => [item.id, item]));

        // Each planned line reuses one of its Square line's current items:
        // first the one with the same menu item and size, then any left over
        // (a remapped line is changed in place).
        const matched = new Map<PlannedSquareLine, OrderMenuItem>();
        const used = new Set<number>();
        const candidatesFor = (line: PlannedSquareLine) =>
            (link.lineMap[line.squareLineUid] ?? [])
                .map((id) => itemsById.get(id))
                .filter(
                    (item): item is OrderMenuItem =>
                        item !== undefined && !used.has(item.id),
                );
        const claim = (line: PlannedSquareLine, item?: OrderMenuItem) => {
            if (item) {
                matched.set(line, item);
                used.add(item.id);
            }
        };
        for (const line of plan.lines) {
            const key = lineKey(line.menuItemId, line.menuItemSizeId);
            claim(
                line,
                candidatesFor(line).find(
                    (item) => lineKey(item.menuItem.id, item.size?.id) === key,
                ),
            );
        }
        for (const line of plan.lines) {
            if (!matched.has(line)) {
                claim(line, candidatesFor(line)[0]);
            }
        }

        const squareItems = plan.lines.map((line) => {
            const existing = matched.get(line);
            return existing
                ? plainToInstance(NestedUpdateOrderMenuItemDto, {
                      id: existing.id,
                      menuItemId: line.menuItemId,
                      sizeId: line.menuItemSizeId,
                      quantity: line.quantity,
                      containerOrderMenuItems: this.updateContainerItemDtos(
                          existing,
                          line,
                      ),
                  })
                : squareLineCreateDto(line);
        });

        const dto = plainToInstance(UpdateOrderDto, {
            ...this.orderFields(plan.fields),
            orderedItems: [
                ...staffItems.map((item) =>
                    orderMenuItemToNestedUpdateDto(item),
                ),
                ...squareItems,
            ],
        });
        await this.orderService.update(order.id, dto);

        return {
            orderId: order.id,
            lineMap: await this.buildLineMap(
                order.id,
                plan.lines,
                new Set(staffItems.map((item) => item.id)),
            ),
        };
    }

    /**
     * The planned contents of an existing item: contained items with the same
     * menu item and size are updated, the rest created; omitted ones are
     * deleted as orphans.
     */
    private updateContainerItemDtos(
        existing: OrderMenuItem,
        line: PlannedSquareLine,
    ): (
        | NestedCreateOrderContainerItemDto
        | NestedUpdateOrderContainerItemDto
    )[] {
        const currentByKey = new Map(
            (existing.containerOrderMenuItems ?? []).map((item) => [
                lineKey(item.containedMenuItem.id, item.containedItemSize.id),
                item,
            ]),
        );
        const toCreate: PlannedContainerItem[] = [];
        const updates: NestedUpdateOrderContainerItemDto[] = [];
        for (const planned of line.containerItems) {
            const current = currentByKey.get(
                lineKey(planned.menuItemId, planned.menuItemSizeId),
            );
            if (current) {
                updates.push(
                    plainToInstance(NestedUpdateOrderContainerItemDto, {
                        id: current.id,
                        containedMenuItemId: planned.menuItemId,
                        containedItemSizeId: planned.menuItemSizeId,
                        quantity: planned.quantity,
                    }),
                );
            } else {
                toCreate.push(planned);
            }
        }
        return [
            ...updates,
            ...containerItemCreateDtos(lineCreateId(line), line, toCreate),
        ];
    }

    private orderFields(fields: PlannedOrderFields) {
        return {
            recipient: fields.recipient,
            fulfillmentDate: fields.fulfillmentDate,
            fulfillmentType: fields.fulfillmentType,
            phoneNumber: fields.phoneNumber,
            email: fields.email,
            deliveryAddress: fields.deliveryAddress,
        };
    }

    /**
     * Square uid → order item ids, matched by menu item and size (unique per
     * order, enforced by `OrderValidator`), ignoring staff-added items.
     */
    private async buildLineMap(
        orderId: number,
        lines: PlannedSquareLine[],
        staffItemIds: Set<number>,
    ): Promise<SquareOrderLineMap> {
        const items = await this.orderRepo.manager.find(OrderMenuItem, {
            where: { parentOrder: { id: orderId } },
            relations: ['menuItem', 'size'],
        });
        const idByKey = new Map(
            items
                .filter((item) => !staffItemIds.has(item.id))
                .map((item) => [
                    lineKey(item.menuItem.id, item.size?.id),
                    item.id,
                ]),
        );
        const lineMap: SquareOrderLineMap = {};
        for (const line of lines) {
            const id = idByKey.get(
                lineKey(line.menuItemId, line.menuItemSizeId),
            );
            if (id !== undefined) {
                (lineMap[line.squareLineUid] ??= []).push(id);
            }
        }
        return lineMap;
    }

    private async saveOrderLink(
        manager: EntityManager,
        args: {
            existing: SquareOrderLink | null;
            tenantId: number;
            plan: SquareOrderPlan;
            orderId: number;
            lineMap: SquareOrderLineMap;
        },
    ): Promise<void> {
        const link =
            args.existing ??
            manager.create(SquareOrderLink, {
                tenantId: args.tenantId,
                squareOrderId: args.plan.squareOrderId,
                status: 'linked',
            });
        link.squareVersion = args.plan.squareVersion;
        link.squareLocationId = args.plan.squareLocationId;
        link.orderId = args.orderId;
        link.lineMap = args.lineMap;
        await manager.save(link);
    }

    /**
     * Upserts the plan's unresolved lines as pending (a dismissed line stays
     * dismissed). A pending line that ingest now places becomes resolved; one
     * whose Square line is gone or now skipped is deleted.
     */
    private async syncUnresolvedLines(
        manager: EntityManager,
        args: {
            tenantId: number;
            locationId: number;
            orderId: number;
            plan: SquareOrderPlan;
        },
    ): Promise<void> {
        const { tenantId, plan } = args;
        const existing = await manager.find(SquareUnresolvedLine, {
            where: { tenantId, squareOrderId: plan.squareOrderId },
        });
        const existingByUid = new Map(
            existing.map((row) => [row.squareLineUid, row]),
        );

        const plannedUids = new Set<string>();
        for (const planned of plan.unresolved) {
            plannedUids.add(planned.squareLineUid);
            const row =
                existingByUid.get(planned.squareLineUid) ??
                manager.create(SquareUnresolvedLine, {
                    tenantId,
                    squareOrderId: plan.squareOrderId,
                    squareLineUid: planned.squareLineUid,
                    status: 'pending',
                });
            if (row.status === 'dismissed') {
                continue;
            }
            Object.assign(row, planned, {
                locationId: args.locationId,
                orderId: args.orderId,
                status: 'pending',
            });
            await manager.save(row);
        }

        const placedUids = new Set(plan.lines.map((l) => l.squareLineUid));
        for (const row of existing) {
            if (
                row.status !== 'pending' ||
                plannedUids.has(row.squareLineUid)
            ) {
                continue;
            }
            if (placedUids.has(row.squareLineUid)) {
                row.status = 'resolved';
                await manager.save(row);
            } else {
                await manager.remove(row);
            }
        }
    }
}
