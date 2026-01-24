import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderMenuItemDto } from '../dto/order-menu-item/create-order-menu-item.dto';
import { UpdateOrderMenuItemDto } from '../dto/order-menu-item/update-order-menu-item.dto';
import {
  OrderMenuItem,
  OrderMenuItemEntity,
} from '../entities/order-menu-item.entity';
import { OrderMenuItemComposer } from '../utils/composers/order-menu-item.composer';
import { OrderMenuItemValidator } from '../validators/order-menu-item.validator';

@Injectable()
export class OrderMenuItemService extends ServiceBase<OrderMenuItemEntity> {
  constructor(
    @InjectRepository(OrderMenuItem)
    repo: Repository<OrderMenuItem>,
    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: OrderMenuItemValidator,

    private readonly menuItemComposer: OrderMenuItemComposer,
  ) {
    super(
      repo,
      'OrderMenuItemService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateOrderMenuItemDto,
    manager: EntityManager,
  ): Promise<OrderMenuItem> {
    return await this.menuItemComposer.composeCreate(dto, manager);
  }

  protected async updateEntity(
    dto: UpdateOrderMenuItemDto,
    manager: EntityManager,
    entity: OrderMenuItem,
  ): Promise<void> {
    await this.menuItemComposer.composeUpdate(dto, manager, entity);
  }

  protected applySortBy(
    query: SelectQueryBuilder<OrderMenuItem>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'quantity') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
    if (sortBy === 'menuItem') {
      query.leftJoinAndSelect('entity.menuItem', 'menuItem');
      query.orderBy(`menuItem.name`, sortOrder);
    }
  }
}
