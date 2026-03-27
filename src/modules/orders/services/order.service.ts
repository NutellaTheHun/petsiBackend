import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { Order, OrderEntity } from '../entities/order.entity';
import { OrderMenuItemComposer } from '../utils/composers/order-menu-item.composer';
import { RecurringOrderScheduleComposer } from '../utils/composers/recurring-order-schedule.composer';
import { OCCURRENCE_TYPES, OccurrenceState, OccurrenceType } from '../utils/occurence-types';
import { OrderValidator } from '../validators/order.validator';
import { OrderRecurrenceService } from './order-recurrence.service';

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
        private readonly orderRecurrenceService: OrderRecurrenceService,
    ) {
        super(repo, 'OrderService', requestContextService, logger, validator);
    }

    protected async createEntity(
        dto: CreateOrderDto,
        manager: EntityManager,
    ): Promise<Order> {

        const result = manager.create(Order, {
            orderCategory: { id: dto.categoryId },
            recipient: dto.recipient,
            fulfillmentDate: dto.fulfillmentDate,
            fulfillmentType: dto.fulfillmentType,
            fulfillmentContactName: dto.fulfillmentContactName ?? null,
            deliveryAddress: dto.deliveryAddress ?? null,
            phoneNumber: dto.phoneNumber ?? null,
            email: dto.email ?? null,
            note: dto.note ?? null,
            isFrozen: dto.isFrozen ?? false,
            occurenceType: dto.occurrenceType as OccurrenceType | null,
            occurenceState: dto.occurrenceState as OccurrenceState | null,
            reccurenceDate: dto.recurrenceDate ?? null,
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
                savedResult.recurrenceSchedule = await this.recurringOrderScheduleComposer.composeNestedEntity(
                    dto.recurrenceSchedule,
                    manager,
                    {
                        orderId: savedResult.id,
                    },
                );
            }

            await manager.save(savedResult);
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
            entity.category = manager.create(OrderCategory, {
                id: dto.categoryId,
            });
        }

        if (dto.occurrenceType !== undefined) {
            entity.occurrenceType = dto.occurrenceType as OccurrenceType | null;
        }

        if (dto.occurrenceState !== undefined) {
            entity.occurrenceState = dto.occurrenceState as OccurrenceState | null;
        }

        if (dto.orderedItems && dto.orderedItems.length > 0) {
            entity.orderedItems =
                await this.orderMenuItemComposer.composeManyNestedEntity(
                    dto.orderedItems,
                    manager,
                    [],
                    {
                        parentOrderId: entity.id,
                    },
                );
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
                entity.recurrenceSchedule = await this.recurringOrderScheduleComposer.composeNestedEntity(
                    dto.recurrenceSchedule,
                    manager,
                    {
                        parentOrderId: entity.id,
                    },
                );
            }
        }

        await manager.save(entity);

        if (entity.occurrenceType === OCCURRENCE_TYPES.TEMPLATE) {
            await this.orderRecurrenceService.handleTemplateOrderUpdate(entity.id);
        }
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
