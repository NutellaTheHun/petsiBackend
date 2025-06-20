import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { OrderContainerItemBuilder } from '../builders/order-container-item.builder';
import { OrderContainerItem } from '../entities/order-container-item.entity';

@Injectable()
export class OrderContainerItemService extends ServiceBase<OrderContainerItem> {
  constructor(
    @InjectRepository(OrderContainerItem)
    repo: Repository<OrderContainerItem>,

    @Inject(forwardRef(() => OrderContainerItemBuilder))
    builder: OrderContainerItemBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      repo,
      builder,
      'OrderContainerItemService',
      requestContextService,
      logger,
    );
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
