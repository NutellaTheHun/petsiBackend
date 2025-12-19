import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { MenuItemContainerRuleBuilder } from '../builders/menu-item-container-rule.builder';
import { CreateMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/create-menu-item-container-rule.dto';
import { UpdateMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/update-menu-item-container-rule.dto';
import {
  MenuItemContainerRule,
  MenuItemContainerRuleEntity,
} from '../entities/menu-item-container-rule.entity';
import { MenuItemContainerRuleCreateInTransaction } from '../utils/transactions/menu-item-container-rule.create.transaction';
import { MenuItemContainerRuleUpdateInTransaction } from '../utils/transactions/menu-item-container-rule.update.transaction';
import { MenuItemContainerRuleValidator } from '../validators/menu-item-container-rule.validator';

@Injectable()
export class MenuItemContainerRuleService extends ServiceBase<MenuItemContainerRuleEntity> {
  constructor(
    @InjectRepository(MenuItemContainerRule)
    repo: Repository<MenuItemContainerRule>,

    @Inject(forwardRef(() => MenuItemContainerRuleBuilder))
    builder: MenuItemContainerRuleBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: MenuItemContainerRuleValidator,
  ) {
    super(
      repo,
      builder,
      'MenuItemContainerRuleService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateMenuItemContainerRuleDto,
    manager: EntityManager,
  ): Promise<MenuItemContainerRule> {
    return await MenuItemContainerRuleCreateInTransaction(dto, manager);
  }

  protected async updateEntity(
    dto: UpdateMenuItemContainerRuleDto,
    manager: EntityManager,
    entity: MenuItemContainerRule,
  ): Promise<void> {
    await MenuItemContainerRuleUpdateInTransaction(dto, manager, entity);
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
