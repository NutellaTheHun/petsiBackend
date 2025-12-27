import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { OrderMenuItemBuilder } from '../builders/order-menu-item.builder';
import { CreateOrderMenuItemDto } from '../dto/order-menu-item/create-order-menu-item.dto';
import { UpdateOrderMenuItemDto } from '../dto/order-menu-item/update-order-menu-item.dto';
import {
  OrderMenuItem,
  OrderMenuItemEntity,
} from '../entities/order-menu-item.entity';
import { OrderMenuItemCreateInTransaction } from '../utils/transactions/order-menu-item.create.transaction';
import { OrderMenuItemUpdateInTransaction } from '../utils/transactions/order-menu-item.update.transaction';
import { OrderMenuItemValidator } from '../validators/order-menu-item.validator';

@Injectable()
export class OrderMenuItemService extends ServiceBase<OrderMenuItemEntity> {
  constructor(
    @InjectRepository(OrderMenuItem)
    repo: Repository<OrderMenuItem>,

    @Inject(forwardRef(() => OrderMenuItemBuilder))
    builder: OrderMenuItemBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: OrderMenuItemValidator,
  ) {
    super(
      repo,
      builder,
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
    return await OrderMenuItemCreateInTransaction(dto, manager);
  }

  protected async updateEntity(
    dto: UpdateOrderMenuItemDto,
    manager: EntityManager,
    entity: OrderMenuItem,
  ): Promise<void> {
    await OrderMenuItemUpdateInTransaction(dto, manager, entity);
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
      query.orderBy(`menuItem.itemName`, sortOrder);
    }
  }
}
