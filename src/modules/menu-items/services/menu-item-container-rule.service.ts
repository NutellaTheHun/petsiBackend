import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { MenuItemContainerRuleBuilder } from '../builders/menu-item-container-rule.builder';
import { MenuItemContainerRule } from '../entities/menu-item-container-rule.entity';

@Injectable()
export class MenuItemContainerRuleService extends ServiceBase<MenuItemContainerRule> {
  constructor(
    @InjectRepository(MenuItemContainerRule)
    repo: Repository<MenuItemContainerRule>,

    @Inject(forwardRef(() => MenuItemContainerRuleBuilder))
    builder: MenuItemContainerRuleBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      repo,
      builder,
      'MenuItemContainerRuleService',
      requestContextService,
      logger,
    );
  }

  protected applySortBy(
    query: SelectQueryBuilder<MenuItemContainerRule>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'validItem') {
      query.leftJoinAndSelect('entity.validItem', 'menuItem');
      query.orderBy(`menuItem.itemName`, sortOrder);
    }
  }
}
