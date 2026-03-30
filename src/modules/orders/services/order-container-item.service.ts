import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderContainerItemDto } from '../dto/order-container-item/create-order-container-item.dto';
import { UpdateOrderContainerItemDto } from '../dto/order-container-item/update-order-container-item.dto';
import {
    OrderContainerItem,
    OrderContainerItemEntity,
} from '../entities/order-container-item.entity';
import { OrderContainerItemComposer } from '../utils/composers/order-container-item.composer';
import { OrderContainerItemValidator } from '../validators/order-container-item.validator';

@Injectable()
export class OrderContainerItemService extends ServiceBase<OrderContainerItemEntity> {
    constructor(
        @InjectRepository(OrderContainerItem)
        repo: Repository<OrderContainerItem>,
        requestContextService: RequestContextService,
        logger: AppLogger,
        validator: OrderContainerItemValidator,

        private readonly containerItemComposer: OrderContainerItemComposer,
    ) {
        super(
            repo,
            'OrderContainerItemService',
            requestContextService,
            logger,
            validator,
        );
    }

    protected async createEntity(
        dto: CreateOrderContainerItemDto,
        manager: EntityManager,
    ): Promise<OrderContainerItem> {
        return await manager.save(
            await this.containerItemComposer.composeCreate(dto, manager),
        );
    }

    protected async updateEntity(
        dto: UpdateOrderContainerItemDto,
        manager: EntityManager,
        entity: OrderContainerItem,
    ): Promise<void> {
        await this.containerItemComposer.composeUpdate(dto, manager, entity)
        await manager.save(entity);
    }

    protected applySortBy(
        query: SelectQueryBuilder<OrderContainerItem>,
        sortBy: string,
        sortOrder: 'ASC' | 'DESC',
    ): void {
        if (sortBy === 'containedMenuItem') {
            query.leftJoinAndSelect('entity.containedMenuItem', 'menuItem');
            query.orderBy(`menuItem.name`, sortOrder);
        }
    }

    // filter by parentOrderMenuItem
    protected applyFilters(
        query: SelectQueryBuilder<OrderContainerItem>,
        filters: Record<string, string[]>,
    ): void {
        if (filters.parentOrderMenuItem && filters.parentOrderMenuItem.length > 0) {
            query.andWhere('entity.parentOrderMenuItem IN (:...parentOrderMenuItems)', {
                parentOrderMenuItems: filters.parentOrderMenuItem,
            });
        }
    }
}