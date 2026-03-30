import {
    BadRequestException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import {
    ChangeDetectionResult,
    ChangeDetectorBase,
} from '../../../common/base/change-detector.base';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { REVISION_ENTITY_TYPES } from '../../revision-history/constants/revision-entity-type';
import { RevisionHistoryService } from '../../revision-history/revision-history.service';
import {
    buildCreatedChangeLog,
    buildRevertedChangeLog,
    buildUpdatedChangeLog,
} from '../../revision-history/utils/change-log-builder';
import { getRevisionActor } from '../../revision-history/utils/revision-actor.util';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { OrderContainerItem } from '../entities/order-container-item.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { OrderCategory } from '../entities/order-category.entity';
import { Order, OrderEntity } from '../entities/order.entity';
import { RecurringOrderSchedule } from '../entities/recurring-order-schedule.entity';
import { OrderMenuItemComposer } from '../utils/composers/order-menu-item.composer';
import { RecurringOrderScheduleComposer } from '../utils/composers/recurring-order-schedule.composer';
import { OrderChangeDetector } from '../utils/change-detectors/order.change-detector';
import {
    isOrderSnapshotV1,
    orderToSnapshotV1,
    OrderSnapshotV1,
} from '../utils/snapshots/order-snapshot.v1';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { OCCURRENCE_TYPES, OccurrenceState, OccurrenceType } from '../utils/occurence-types';
import { OrderValidator } from '../validators/order.validator';
import { OrderRecurrenceService } from './order-recurrence.service';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';

@Injectable()
export class OrderService extends ServiceBase<OrderEntity> {
    constructor(
        @InjectRepository(Order)
        repo: Repository<Order>,
        requestContextService: RequestContextService,
        logger: AppLogger,
        validator: OrderValidator,

        private readonly orderMenuItemComposer: OrderMenuItemComposer,
        private readonly recurringOrderScheduleComposer: RecurringOrderScheduleComposer,

        @Inject(OrderRecurrenceService)
        private readonly orderRecurrenceService: OrderRecurrenceService,
        private readonly orderChangeDetector: OrderChangeDetector,
        private readonly revisionHistoryService: RevisionHistoryService,
    ) {
        super(repo, 'OrderService', requestContextService, logger, validator);
    }

    protected async createEntity(
        dto: CreateOrderDto,
        manager: EntityManager,
    ): Promise<Order> {
        const occurrenceType = dto.occurrenceType as OccurrenceType | null;
        const recurrenceDate =
            dto.recurrenceDate ??
            (dto.recurrenceSchedule && occurrenceType === OCCURRENCE_TYPES.TEMPLATE
                ? dto.fulfillmentDate
                : null);

        const categoryRow = await manager.findOne(OrderCategory, {
            where: { id: dto.categoryId },
        });
        const result = manager.create(Order, {
            category: categoryRow
                ? manager.create(OrderCategory, { id: dto.categoryId })
                : null,
            recipient: dto.recipient,
            fulfillmentDate: dto.fulfillmentDate,
            fulfillmentType: dto.fulfillmentType,
            fulfillmentContactName: dto.fulfillmentContactName ?? null,
            deliveryAddress: dto.deliveryAddress ?? null,
            phoneNumber: dto.phoneNumber ?? null,
            email: dto.email ?? null,
            note: dto.note ?? null,
            isFrozen: dto.isFrozen ?? false,
            occurrenceType,
            occurrenceState: dto.occurrenceState as OccurrenceState | null,
            recurrenceDate,
            templateOrderId: dto.templateOrderId ?? null,
        });

        const savedResult = await manager.save(result);

        if (dto.orderedItems.length) {
            savedResult.orderedItems =
                await this.orderMenuItemComposer.composeManyNestedEntity(
                    dto.orderedItems,
                    manager,
                    [],
                    {
                        parentOrderId: savedResult.id,
                    },
                );

            await manager.save(savedResult);
        }

        if (dto.recurrenceSchedule !== undefined) {
            if (dto.recurrenceSchedule === null) {
                savedResult.recurrenceSchedule = null;
            } else {
                savedResult.recurrenceSchedule =
                    await this.recurringOrderScheduleComposer.composeNestedEntity(
                        dto.recurrenceSchedule,
                        manager,
                        {
                            orderId: savedResult.id,
                        },
                    );
            }

            await manager.save(savedResult);
        }

        if (savedResult.occurrenceType === OCCURRENCE_TYPES.TEMPLATE) {
            await this.orderRecurrenceService.materializeTemplateOnCreate(
                savedResult.id,
                manager,
            );
        }

        return savedResult;
    }

    protected async updateEntity(
        dto: UpdateOrderDto,
        manager: EntityManager,
        entity: Order,
    ): Promise<void> {
        if (dto.recipient !== undefined) {
            entity.recipient = dto.recipient;
        }

        if (dto.fulfillmentDate !== undefined) {
            entity.fulfillmentDate = dto.fulfillmentDate;
        }

        if (dto.fulfillmentType !== undefined) {
            entity.fulfillmentType = dto.fulfillmentType;
        }

        if (dto.fulfillmentContactName !== undefined) {
            entity.fulfillmentContactName = dto.fulfillmentContactName;
        }

        if (dto.deliveryAddress !== undefined) {
            entity.deliveryAddress = dto.deliveryAddress;
        }

        if (dto.phoneNumber !== undefined) {
            entity.phoneNumber = dto.phoneNumber;
        }

        if (dto.email !== undefined) {
            entity.email = dto.email;
        }

        if (dto.note !== undefined) {
            entity.note = dto.note;
        }

        if (dto.isFrozen !== undefined) {
            entity.isFrozen = dto.isFrozen;
        }

        if (dto.categoryId !== undefined) {
            if (dto.categoryId === null) {
                entity.category = null;
            } else {
                const exists = await manager.findOne(OrderCategory, {
                    where: { id: dto.categoryId },
                });
                entity.category = exists
                    ? manager.create(OrderCategory, { id: dto.categoryId })
                    : null;
            }
        }

        if (dto.occurrenceType !== undefined) {
            entity.occurrenceType = dto.occurrenceType as OccurrenceType | null;
        }

        if (dto.occurrenceState !== undefined) {
            entity.occurrenceState = dto.occurrenceState as OccurrenceState | null;
        }

        if (dto.orderedItems !== undefined) {
            const previous = [...(entity.orderedItems ?? [])];
            const newItems = await this.orderMenuItemComposer.composeManyNestedEntity(
                dto.orderedItems,
                manager,
                previous,
                {
                    parentOrderId: entity.id,
                },
            );
            const newIds = new Set(newItems.map((x) => x.id));
            for (const old of previous) {
                if (!newIds.has(old.id)) {
                    await manager.remove(old);
                }
            }
            entity.orderedItems = newItems;
        }

        if (dto.recurrenceSchedule !== undefined) {
            if (dto.recurrenceSchedule === null) {
                const existingSchedule = entity.recurrenceSchedule;

                entity.recurrenceSchedule = null;
                entity.occurrenceType = null;

                await manager.save(entity);

                if (existingSchedule) {
                    await manager.remove(existingSchedule);
                }
            } else {
                entity.recurrenceSchedule =
                    await this.recurringOrderScheduleComposer.composeNestedEntity(
                        dto.recurrenceSchedule,
                        manager,
                        {
                            orderId: entity.id,
                        },
                    );
            }
        }

        await manager.save(entity);

        await this.runAfterOrderPersist(entity.id);
    }

    /**
     * Same side effects as after a successful update (e.g. regenerate recurring occurrences).
     */
    async runAfterOrderPersist(orderId: number): Promise<void> {
        const entity = await this.entityRepo.findOne({ where: { id: orderId } });
        if (entity?.occurrenceType === OCCURRENCE_TYPES.TEMPLATE) {
            await this.orderRecurrenceService.handleTemplateOrderUpdate(orderId);
        }
    }

    protected async afterCreateInTransaction(
        manager: EntityManager,
        entity: Order,
    ): Promise<void> {
        const full = await manager.findOne(Order, {
            where: { id: entity.id },
            relations: this.getSnapshotRelations(),
        });
        if (!full) {
            return;
        }
        const actor = getRevisionActor(this.requestContextService);
        const changeLog = buildCreatedChangeLog(actor);
        const payload = orderToSnapshotV1(full);
        await this.revisionHistoryService.appendRevision(manager, {
            entityType: REVISION_ENTITY_TYPES.ORDER,
            entityId: full.id,
            changeLog: changeLog as unknown as Record<string, unknown>,
            payload: payload as unknown as Record<string, unknown>,
        });
    }

    protected async afterUpdateInTransaction(
        manager: EntityManager,
        entity: Order,
        ctx: {
            detectionResult?: ChangeDetectionResult<UpdateOrderDto>;
        },
    ): Promise<void> {
        if (!ctx.detectionResult?.hasChanges) {
            return;
        }
        const full = await manager.findOne(Order, {
            where: { id: entity.id },
            relations: this.getSnapshotRelations(),
        });
        if (!full) {
            return;
        }
        const actor = getRevisionActor(this.requestContextService);
        const changeLog = buildUpdatedChangeLog(
            ctx.detectionResult.changes,
            actor,
        );
        const payload = orderToSnapshotV1(full);
        await this.revisionHistoryService.appendRevision(manager, {
            entityType: REVISION_ENTITY_TYPES.ORDER,
            entityId: full.id,
            changeLog: changeLog as unknown as Record<string, unknown>,
            payload: payload as unknown as Record<string, unknown>,
        });
    }

    private getSnapshotRelations(): string[] {
        return this.getUpdateDiffRelations();
    }

    /**
     * Restores an order from a stored snapshot (revert). Caller commits transaction.
     */
    async applyOrderSnapshotV1(
        manager: EntityManager,
        order: Order,
        snap: OrderSnapshotV1,
    ): Promise<void> {
        order.recipient = snap.recipient;
        order.fulfillmentDate = new Date(snap.fulfillmentDate);
        order.fulfillmentType = snap.fulfillmentType;
        order.fulfillmentContactName = snap.fulfillmentContactName;
        order.deliveryAddress = snap.deliveryAddress;
        order.phoneNumber = snap.phoneNumber;
        order.email = snap.email;
        order.note = snap.note;
        order.isFrozen = snap.isFrozen;

        if (snap.categoryId != null) {
            const exists = await manager.findOne(OrderCategory, {
                where: { id: snap.categoryId },
            });
            order.category = exists
                ? manager.create(OrderCategory, { id: snap.categoryId })
                : null;
        } else {
            order.category = null;
        }

        order.occurrenceType = snap.occurrenceType as OccurrenceType | null;
        order.occurrenceState = snap.occurrenceState as OccurrenceState | null;
        order.recurrenceDate = snap.recurrenceDate
            ? new Date(snap.recurrenceDate)
            : null;
        order.templateOrderId = snap.templateOrderId;

        const existingLines = await manager.find(OrderMenuItem, {
            where: { parentOrder: { id: order.id } },
            relations: ['containerOrderMenuItems'],
        });
        for (const line of existingLines) {
            await manager.remove(line);
        }
        order.orderedItems = [];

        for (const line of snap.orderedItems) {
            const omi = manager.create(OrderMenuItem, {
                parentOrder: order,
                menuItem: manager.create(MenuItem, { id: line.menuItemId }),
                size:
                    line.sizeId != null
                        ? manager.create(MenuItemSize, { id: line.sizeId })
                        : null,
                quantity: line.quantity,
            });
            const savedLine = await manager.save(omi);
            for (const c of line.containerItems) {
                const oci = manager.create(OrderContainerItem, {
                    parentOrderMenuItem: savedLine,
                    containedMenuItem: manager.create(MenuItem, {
                        id: c.containedMenuItemId,
                    }),
                    containedItemSize: manager.create(MenuItemSize, {
                        id: c.containedItemSizeId,
                    }),
                    quantity: c.quantity,
                });
                await manager.save(oci);
            }
        }

        if (snap.recurrenceSchedule === null) {
            const existingSchedule = order.recurrenceSchedule;
            order.recurrenceSchedule = null;
            if (existingSchedule) {
                await manager.remove(existingSchedule);
            }
        } else {
            const existingSchedule = order.recurrenceSchedule;
            if (existingSchedule) {
                await manager.remove(existingSchedule);
                order.recurrenceSchedule = null;
            }
            const rs = manager.create(RecurringOrderSchedule, {
                order,
                rrule: snap.recurrenceSchedule.rrule,
                startDate: new Date(snap.recurrenceSchedule.startDate),
                endDate: snap.recurrenceSchedule.endDate
                    ? new Date(snap.recurrenceSchedule.endDate)
                    : null,
                timezone:
                    snap.recurrenceSchedule.timezone ?? 'America/New_York',
            });
            order.recurrenceSchedule = await manager.save(rs);
        }

        await manager.save(order);
    }

    async revertToRevision(
        orderId: number,
        targetRevisionNumber: number,
    ): Promise<Order> {
        const row = await this.revisionHistoryService.getRevisionRow(
            REVISION_ENTITY_TYPES.ORDER,
            orderId,
            targetRevisionNumber,
        );
        if (!row) {
            throw new NotFoundException(
                `Revision ${targetRevisionNumber} not found for order ${orderId}`,
            );
        }
        const payload = row.payload;
        if (!isOrderSnapshotV1(payload)) {
            throw new BadRequestException('Unsupported or invalid order snapshot payload');
        }

        await this.entityRepo.manager.transaction(async (manager) => {
            const order = await manager.findOne(Order, {
                where: { id: orderId },
                relations: [
                    'category',
                    'orderedItems',
                    'orderedItems.menuItem',
                    'orderedItems.size',
                    'orderedItems.containerOrderMenuItems',
                    'recurrenceSchedule',
                ],
            });
            if (!order) {
                throw new NotFoundException();
            }
            await this.applyOrderSnapshotV1(manager, order, payload);
            const actor = getRevisionActor(this.requestContextService);
            const changeLog = buildRevertedChangeLog(targetRevisionNumber, actor);
            const full = await manager.findOne(Order, {
                where: { id: orderId },
                relations: this.getSnapshotRelations(),
            });
            if (!full) {
                throw new NotFoundException();
            }
            await this.revisionHistoryService.appendRevision(manager, {
                entityType: REVISION_ENTITY_TYPES.ORDER,
                entityId: orderId,
                changeLog: changeLog as unknown as Record<string, unknown>,
                payload: orderToSnapshotV1(full) as unknown as Record<
                    string,
                    unknown
                >,
            });
        });

        await this.runAfterOrderPersist(orderId);

        const result = await this.entityRepo.findOne({
            where: { id: orderId },
            relations: this.getSnapshotRelations(),
        });
        if (!result) {
            throw new NotFoundException();
        }
        return result;
    }

    protected getChangeDetector(): ChangeDetectorBase<Order, UpdateOrderDto> | undefined {
        return this.orderChangeDetector;
    }

    protected getUpdateDiffRelations(): string[] {
        return [
            'category',
            'orderedItems',
            'orderedItems.menuItem',
            'orderedItems.size',
            'orderedItems.containerOrderMenuItems',
            'orderedItems.containerOrderMenuItems.containedMenuItem',
            'orderedItems.containerOrderMenuItems.containedItemSize',
            'recurrenceSchedule',
        ];
    }

    protected applySearch(
        query: SelectQueryBuilder<Order>,
        search: string,
    ): void {
        query
            .leftJoin('entity.orderedItems', 'searchOrderedItem')
            .leftJoin('searchOrderedItem.menuItem', 'searchMenuItem')
            .andWhere(
                `(LOWER(entity.recipient) LIKE :search OR LOWER(searchMenuItem.name) LIKE :search)`,
                { search: `%${search.toLowerCase()}%` },
            );
    }

    protected applyFilters(
        query: SelectQueryBuilder<Order>,
        filters: Record<string, string[]>,
    ): void {
        if (filters.category && filters.category.length > 0) {
            query.andWhere('entity.category IN (:...categories)', {
                categories: filters.category,
            });
        }

        if (filters.isFrozen && filters.isFrozen.length > 0) {
            query.andWhere('entity.isFrozen IN (:...isFrozen)', {
                isFrozen: filters.isFrozen,
            });
        }

        if (filters.fulfillmentType && filters.fulfillmentType.length > 0) {
            query.andWhere('entity.fulfillmentType IN (:...fulfillmentType)', {
                fulfillmentType: filters.fulfillmentType,
            });
        }
    }

    protected applyDate(
        query: SelectQueryBuilder<Order>,
        startDate: string,
        endDate?: string,
        dateBy?: string,
    ): void {
        if (dateBy === 'createdAt' || dateBy === 'fulfillmentDate') {
            query.andWhere(`DATE(entity.${dateBy}) >= :startDate`, { startDate });

            if (endDate) {
                query.andWhere(`DATE(entity.${dateBy}) <= :endDate`, { endDate });
            }
        }
    }

    protected applySortBy(
        query: SelectQueryBuilder<Order>,
        sortBy: string,
        sortOrder: 'ASC' | 'DESC',
    ): void {
        if (sortBy === 'category') {
            query.leftJoinAndSelect('entity.category', 'category');
            query.orderBy(`category.name`, sortOrder);
        } else if (sortBy === 'recipient') {
            query.orderBy(`entity.${sortBy}`, sortOrder);
        } else if (sortBy === 'fulfillmentDate') {
            query.orderBy(`entity.${sortBy}`, sortOrder);
        } else if (sortBy === 'createdAt') {
            query.orderBy(`entity.${sortBy}`, sortOrder);
        }
    }
}
