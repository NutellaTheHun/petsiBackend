import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Square } from 'square';
import { EntityManager, In, Repository } from 'typeorm';
import { ValidationException } from '../../../common/validation/validation-exception';
import { UpdateOrderDto } from '../../orders/dto/order/update-order.dto';
import { OrderMenuItem } from '../../orders/entities/order-menu-item.entity';
import { Order } from '../../orders/entities/order.entity';
import { OrderWriteHooks } from '../../orders/services/order-write-hooks.service';
import { OrderService } from '../../orders/services/order.service';
import { orderMenuItemToNestedUpdateDto } from '../../orders/utils/entity-transformers/order-menu-item.dto.transformer';
import { ORDER_STATUSES } from '../../orders/utils/order-statuses';
import { RequestContextService } from '../../request-context/RequestContextService';
import { SquareModifierLink } from '../entities/square-modifier-link.entity';
import { SquareOrderIssue } from '../entities/square-order-issue.entity';
import { SquareOrderLink } from '../entities/square-order-link.entity';
import {
    SquareUnresolvedLine,
    SquareUnresolvedLineReason,
} from '../entities/square-unresolved-line.entity';
import { SquareVariationLink } from '../entities/square-variation-link.entity';
import {
    PlannedSquareLine,
    placeSquareLine,
    SquareLineMappingInput,
} from '../utils/square-order-mapper';
import {
    adHocMappingsOf,
    lineKey,
    mappedMenuItemIds,
    ORDER_LINE_RELATIONS,
    SquareOrderIngestService,
    squareLineCreateDto,
} from './square-order-ingest.service';

export interface SquareConversionResult {
    /** Pending lines now placed on their orders (status `resolved`). */
    convertedLineIds: number[];
    /**
     * Orders `OrderService` rejected: their lines stay pending and the
     * order gets a `validation_failed` issue.
     */
    failedOrderIds: number[];
}

/**
 * Converts pending unresolved lines into order items once they resolve: after
 * a mapping change (variation, modifier, item hint, size alias), an ad-hoc
 * mapping, a retry, or unfreezing the order.
 *
 * Each line is rebuilt from its row (variation id, modifier snapshot,
 * quantity) and placed with the current links, exactly as ingest would place
 * it; no Square call is made. Only orders that are `ACTIVE`, not frozen and
 * still `linked` are converted, regardless of due date; other lines wait.
 * One `OrderService.update` per order, with the resolving user as revision
 * actor, and the order link's line map and the lines' `resolved` status are
 * written in that same transaction (through `OrderWriteHooks`). An order that
 * fails validation keeps its lines pending, gets an issue, and doesn't stop
 * the others.
 */
@Injectable()
export class SquareLineConversionService implements OnModuleInit {
    constructor(
        @InjectRepository(SquareUnresolvedLine)
        private readonly unresolvedRepo: Repository<SquareUnresolvedLine>,
        @InjectRepository(SquareOrderLink)
        private readonly orderLinkRepo: Repository<SquareOrderLink>,
        @InjectRepository(SquareOrderIssue)
        private readonly issueRepo: Repository<SquareOrderIssue>,
        @InjectRepository(SquareVariationLink)
        private readonly variationLinkRepo: Repository<SquareVariationLink>,
        @InjectRepository(SquareModifierLink)
        private readonly modifierLinkRepo: Repository<SquareModifierLink>,
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,
        private readonly ingest: SquareOrderIngestService,
        private readonly orderService: OrderService,
        private readonly orderWriteHooks: OrderWriteHooks,
        private readonly requestContext: RequestContextService,
    ) {}

    onModuleInit(): void {
        // Lines on a frozen order wait until it's unfrozen.
        this.orderWriteHooks.onUnfrozen(async (order) => {
            await this.convertForOrders(order.tenantId, [order.id]);
        });
    }

    /** Pending lines of these variation links. */
    async convertForVariationLinks(
        tenantId: number,
        variationLinkIds: number[],
    ): Promise<SquareConversionResult> {
        const links = variationLinkIds.length
            ? await this.variationLinkRepo.find({
                  where: { tenantId, id: In(variationLinkIds) },
                  select: { id: true, squareVariationId: true },
              })
            : [];
        if (!links.length) {
            return emptyResult();
        }
        return this.convertRows(
            tenantId,
            await this.unresolvedRepo.find({
                where: {
                    tenantId,
                    status: 'pending',
                    squareVariationId: In(
                        links.map((l) => l.squareVariationId),
                    ),
                },
            }),
        );
    }

    /** Pending lines with one of these modifier links among their modifiers. */
    async convertForModifierLinks(
        tenantId: number,
        modifierLinkIds: number[],
    ): Promise<SquareConversionResult> {
        const links = modifierLinkIds.length
            ? await this.modifierLinkRepo.find({
                  where: { tenantId, id: In(modifierLinkIds) },
                  select: { id: true, squareModifierId: true },
              })
            : [];
        if (!links.length) {
            return emptyResult();
        }
        const rows = await this.unresolvedRepo
            .createQueryBuilder('line')
            .where('line.tenantId = :tenantId', { tenantId })
            .andWhere("line.status = 'pending'")
            .andWhere(
                `EXISTS (SELECT 1 FROM jsonb_array_elements("line"."squareModifiers") m
                    WHERE m->>'squareModifierId' = ANY(:modifierIds))`,
                { modifierIds: links.map((l) => l.squareModifierId) },
            )
            .getMany();
        return this.convertRows(tenantId, rows);
    }

    /** Every pending line of these orders. */
    async convertForOrders(
        tenantId: number,
        orderIds: number[],
    ): Promise<SquareConversionResult> {
        if (!orderIds.length) {
            return emptyResult();
        }
        return this.convertRows(
            tenantId,
            await this.unresolvedRepo.find({
                where: { tenantId, status: 'pending', orderId: In(orderIds) },
            }),
        );
    }

    /** These lines, if still pending. */
    async convertLines(
        tenantId: number,
        lineIds: number[],
    ): Promise<SquareConversionResult> {
        if (!lineIds.length) {
            return emptyResult();
        }
        return this.convertRows(
            tenantId,
            await this.unresolvedRepo.find({
                where: { tenantId, status: 'pending', id: In(lineIds) },
            }),
        );
    }

    /** A disabled variation's pending lines are dismissed (tenant-wide). */
    async dismissPendingForVariation(
        tenantId: number,
        squareVariationId: string,
    ): Promise<void> {
        await this.unresolvedRepo.update(
            { tenantId, squareVariationId, status: 'pending' },
            { status: 'dismissed' },
        );
    }

    private async convertRows(
        tenantId: number,
        rows: SquareUnresolvedLine[],
    ): Promise<SquareConversionResult> {
        const byOrder = new Map<number, SquareUnresolvedLine[]>();
        for (const row of rows) {
            if (row.orderId != null) {
                byOrder.set(row.orderId, [
                    ...(byOrder.get(row.orderId) ?? []),
                    row,
                ]);
            }
        }
        const actorUserId = this.requestContext.get<number>('userId');
        const result = emptyResult();
        for (const orderId of [...byOrder.keys()].sort((a, b) => a - b)) {
            const outcome = await this.convertOrder(
                tenantId,
                orderId,
                byOrder.get(orderId)!,
                actorUserId,
            );
            if (outcome.kind === 'failed') {
                result.failedOrderIds.push(orderId);
            } else {
                result.convertedLineIds.push(...outcome.lineIds);
            }
        }
        return result;
    }

    private async convertOrder(
        tenantId: number,
        orderId: number,
        rows: SquareUnresolvedLine[],
        actorUserId: number | undefined,
    ): Promise<{ kind: 'converted'; lineIds: number[] } | { kind: 'failed' }> {
        const order = await this.orderRepo.findOne({
            where: { id: orderId, tenantId },
            relations: ORDER_LINE_RELATIONS,
        });
        const link = await this.orderLinkRepo.findOne({
            where: { tenantId, orderId, status: 'linked' },
        });
        if (
            !order ||
            !link ||
            order.status !== ORDER_STATUSES.ACTIVE ||
            order.isFrozen
        ) {
            return { kind: 'converted', lineIds: [] };
        }

        const input = await this.mappingInput(tenantId, rows);
        const placed: {
            row: SquareUnresolvedLine;
            lines: PlannedSquareLine[];
        }[] = [];
        const dismissedIds: number[] = [];
        const newReasons = new Map<SquareUnresolvedLineReason, number[]>();
        for (const row of rows) {
            const placement = placeSquareLine(
                toLineItem(row),
                row.squareLineUid,
                row.quantity,
                input,
            );
            if (placement.kind === 'placed') {
                placed.push({ row, lines: placement.items });
            } else if (placement.kind === 'skip') {
                // The variation was disabled since the line was recorded
                dismissedIds.push(row.id);
            } else if (
                placement.kind === 'unresolved' &&
                placement.reason !== row.reason
            ) {
                newReasons.set(placement.reason, [
                    ...(newReasons.get(placement.reason) ?? []),
                    row.id,
                ]);
            }
        }
        if (dismissedIds.length) {
            await this.unresolvedRepo.update(
                { id: In(dismissedIds), status: 'pending' },
                { status: 'dismissed' },
            );
        }
        for (const [reason, ids] of newReasons) {
            await this.unresolvedRepo.update(
                { id: In(ids), status: 'pending' },
                { reason },
            );
        }
        if (!placed.length) {
            return { kind: 'converted', lineIds: [] };
        }

        const existingItems = order.orderedItems ?? [];
        const dto = plainToInstance(UpdateOrderDto, {
            orderedItems: [
                ...existingItems.map((item) =>
                    orderMenuItemToNestedUpdateDto(item),
                ),
                ...placed.flatMap((p) => p.lines.map(squareLineCreateDto)),
            ],
        });
        const lineIds = placed.map((p) => p.row.id);
        try {
            await this.requestContext.runWithContext(
                {
                    tenantId,
                    // A system writer may write at any of the tenant's locations.
                    isTenantAdmin: true,
                    userId: actorUserId,
                    locations: undefined,
                    roles: undefined,
                    revisionActorType:
                        actorUserId == null ? 'square_webhook' : undefined,
                },
                () =>
                    this.orderWriteHooks.runWithInTransactionHook(
                        order.id,
                        (manager) =>
                            this.afterConvert(manager, {
                                link,
                                existingItemIds: new Set(
                                    existingItems.map((item) => item.id),
                                ),
                                lines: placed.flatMap((p) => p.lines),
                                lineIds,
                            }),
                        () => this.orderService.update(order.id, dto),
                    ),
            );
        } catch (err) {
            if (!(err instanceof ValidationException)) {
                throw err;
            }
            await this.recordFailure(order, link, lineIds, err);
            return { kind: 'failed' };
        }
        return { kind: 'converted', lineIds };
    }

    /**
     * In the order update's transaction: the new items join the line map,
     * the lines become resolved, and an open conversion issue is resolved.
     */
    private async afterConvert(
        manager: EntityManager,
        args: {
            link: SquareOrderLink;
            existingItemIds: Set<number>;
            lines: PlannedSquareLine[];
            lineIds: number[];
        },
    ): Promise<void> {
        const { link } = args;
        const items = await manager.find(OrderMenuItem, {
            where: { parentOrder: { id: link.orderId! } },
            relations: ['menuItem', 'size'],
        });
        const newIdByKey = new Map(
            items
                .filter((item) => !args.existingItemIds.has(item.id))
                .map((item) => [
                    lineKey(item.menuItem.id, item.size?.id),
                    item.id,
                ]),
        );
        const lineMap = { ...link.lineMap };
        for (const line of args.lines) {
            const id = newIdByKey.get(
                lineKey(line.menuItemId, line.menuItemSizeId),
            );
            if (id !== undefined) {
                lineMap[line.squareLineUid] = [
                    ...(lineMap[line.squareLineUid] ?? []),
                    id,
                ];
            }
        }
        await manager.update(SquareOrderLink, { id: link.id }, { lineMap });
        await manager.update(
            SquareUnresolvedLine,
            { id: In(args.lineIds), status: 'pending' },
            { status: 'resolved' },
        );
        const issue = await manager.findOne(SquareOrderIssue, {
            where: {
                tenantId: link.tenantId,
                squareOrderId: link.squareOrderId,
            },
        });
        if (issue?.status === 'open' && issue.detail?.unresolvedLineIds) {
            await manager.update(
                SquareOrderIssue,
                { id: issue.id },
                { status: 'resolved', lastAttemptAt: new Date() },
            );
        }
    }

    /**
     * Records the rejected conversion as the order's issue. An open issue
     * from a rejected Square update is left alone (it's the one staff need
     * to see first), and a dismissed issue stays dismissed.
     */
    private async recordFailure(
        order: Order,
        link: SquareOrderLink,
        lineIds: number[],
        err: ValidationException,
    ): Promise<void> {
        const existing = await this.issueRepo.findOne({
            where: {
                tenantId: link.tenantId,
                squareOrderId: link.squareOrderId,
            },
        });
        if (
            existing?.status === 'open' &&
            !existing.detail?.unresolvedLineIds
        ) {
            return;
        }
        const issue =
            existing ??
            this.issueRepo.create({
                tenantId: link.tenantId,
                squareOrderId: link.squareOrderId,
            });
        Object.assign(issue, {
            squareLocationId: link.squareLocationId,
            squareVersion: link.squareVersion,
            locationId: order.locationId,
            orderId: order.id,
            reason: 'validation_failed',
            detail: {
                validationErrors: err.errors,
                unresolvedLineIds: lineIds,
            },
            status: issue.status === 'dismissed' ? 'dismissed' : 'open',
            lastAttemptAt: new Date(),
        });
        await this.issueRepo.save(issue);
    }

    /** The current links (and container definitions) these lines need. */
    private async mappingInput(
        tenantId: number,
        rows: SquareUnresolvedLine[],
    ): Promise<SquareLineMappingInput> {
        const variationIds = [
            ...new Set(
                rows
                    .map((row) => row.squareVariationId)
                    .filter((id): id is string => id != null),
            ),
        ];
        const modifierIds = [
            ...new Set(
                rows
                    .flatMap((row) => row.squareModifiers)
                    .map((m) => m.squareModifierId)
                    .filter((id): id is string => id != null),
            ),
        ];
        const variations = new Map(
            (variationIds.length
                ? await this.variationLinkRepo.find({
                      where: { tenantId, squareVariationId: In(variationIds) },
                  })
                : []
            ).map((link) => [link.squareVariationId, link]),
        );
        const modifiers = new Map(
            (modifierIds.length
                ? await this.modifierLinkRepo.find({
                      where: { tenantId, squareModifierId: In(modifierIds) },
                  })
                : []
            ).map((link) => [link.squareModifierId, link]),
        );
        const adHocMappings = adHocMappingsOf(rows);
        return {
            variations,
            modifiers,
            adHocMappings,
            containers: await this.ingest.loadContainers(tenantId, [
                ...mappedMenuItemIds(variations.values()),
                ...mappedMenuItemIds(adHocMappings.values()),
            ]),
        };
    }
}

function emptyResult(): SquareConversionResult {
    return { convertedLineIds: [], failedOrderIds: [] };
}

/** The Square line an unresolved row was recorded from (no money). */
function toLineItem(row: SquareUnresolvedLine): Square.OrderLineItem {
    return {
        uid: row.squareLineUid,
        quantity: String(row.quantity),
        catalogObjectId: row.squareVariationId ?? undefined,
        name: row.squareItemName ?? undefined,
        variationName: row.squareVariationName ?? undefined,
        modifiers: row.squareModifiers.map((m) => ({
            catalogObjectId: m.squareModifierId ?? undefined,
            name: m.name ?? undefined,
            quantity: String(m.quantity),
        })),
    };
}
