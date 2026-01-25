import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/create-menu-item-container-item.dto';
import { UpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/update-menu-item-container-item.dto';
import {
  MenuItemContainerItem,
  MenuItemContainerItemEntity,
} from '../entities/menu-item-container-item.entity';
import { MenuItemContainerItemComposer } from '../utils/composers/menu-item-container-item.composer';
import { MenuItemContainerItemValidator } from '../validators/menu-item-container-item.validator';

@Injectable()
export class MenuItemContainerItemService extends ServiceBase<MenuItemContainerItemEntity> {
  constructor(
    @InjectRepository(MenuItemContainerItem)
    repo: Repository<MenuItemContainerItem>,
    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: MenuItemContainerItemValidator,

    private readonly containerItemComposer: MenuItemContainerItemComposer,
  ) {
    super(
      repo,
      'MenuItemContainerItemService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateMenuItemContainerItemDto,
    manager: EntityManager,
  ): Promise<MenuItemContainerItem> {
    return await manager.save(
      await this.containerItemComposer.composeCreate(dto, manager),
    );
  }

  protected async updateEntity(
    dto: UpdateMenuItemContainerItemDto,
    manager: EntityManager,
    entity: MenuItemContainerItem,
  ): Promise<void> {
    await manager.save(
      await this.containerItemComposer.composeUpdate(dto, manager, entity),
    );
  }

  protected applySortBy(
    query: SelectQueryBuilder<MenuItemContainerItem>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'containedMenuItem') {
      query.leftJoinAndSelect('entity.containedMenuItem', 'menuItem');
      query.orderBy(`menuItem.name`, sortOrder);
    }
  }
}
