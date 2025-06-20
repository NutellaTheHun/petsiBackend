import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { OrderMenuItemBuilder } from '../builders/order-menu-item.builder';
import { OrderMenuItem } from '../entities/order-menu-item.entity';

@Injectable()
export class OrderMenuItemService extends ServiceBase<OrderMenuItem> {
  constructor(
    @InjectRepository(OrderMenuItem)
    repo: Repository<OrderMenuItem>,

    @Inject(forwardRef(() => OrderMenuItemBuilder))
    builder: OrderMenuItemBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(repo, builder, 'OrderMenuItemService', requestContextService, logger);
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
