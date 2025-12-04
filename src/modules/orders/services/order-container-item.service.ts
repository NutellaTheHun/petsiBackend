import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { OrderContainerItemBuilder } from '../builders/order-container-item.builder';
import { CreateOrderContainerItemDto } from '../dto/order-container-item/create-order-container-item.dto';
import { UpdateOrderContainerItemDto } from '../dto/order-container-item/update-order-container-item.dto';
import {
  OrderContainerItem,
  OrderContainerItemEntity,
} from '../entities/order-container-item.entity';
import { OrderContainerItemCreateInTransaction } from '../utils/transactions/order-container-item.create.transaction';
import { OrderContainerItemUpdateInTransaction } from '../utils/transactions/order-container-item.update.transaction';
import { OrderContainerItemValidator } from '../validators/order-container-item.validator';

@Injectable()
export class OrderContainerItemService extends ServiceBase<OrderContainerItemEntity> {
  constructor(
    @InjectRepository(OrderContainerItem)
    repo: Repository<OrderContainerItem>,

    @Inject(forwardRef(() => OrderContainerItemBuilder))
    builder: OrderContainerItemBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: OrderContainerItemValidator,
  ) {
    super(
      repo,
      builder,
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
    return await OrderContainerItemCreateInTransaction(dto, manager);
  }

  protected async updateEntity(
    dto: UpdateOrderContainerItemDto,
    manager: EntityManager,
    entity: OrderContainerItem,
  ): Promise<void> {
    await OrderContainerItemUpdateInTransaction(dto, manager, entity);
  }

  protected applySortBy(
    query: SelectQueryBuilder<OrderContainerItem>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'containedItem') {
      query.leftJoinAndSelect('entity.containedItem', 'menuItem');
      query.orderBy(`menuItem.itemName`, sortOrder);
    }
  }
}
