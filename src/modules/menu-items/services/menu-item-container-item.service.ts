import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { MenuItemContainerItemBuilder } from '../builders/menu-item-container-item.builder';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';

@Injectable()
export class MenuItemContainerItemService extends ServiceBase<MenuItemContainerItem> {
  constructor(
    @InjectRepository(MenuItemContainerItem)
    repo: Repository<MenuItemContainerItem>,

    @Inject(forwardRef(() => MenuItemContainerItemBuilder))
    builder: MenuItemContainerItemBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      repo,
      builder,
      'MenuItemContainerItemService',
      requestContextService,
      logger,
    );
  }

  protected applySortBy(
    query: SelectQueryBuilder<MenuItemContainerItem>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'containedItem') {
      query.leftJoinAndSelect('entity.containedItem', 'menuItem');
      query.orderBy(`menuItem.itemName`, sortOrder);
    }
  }
}
