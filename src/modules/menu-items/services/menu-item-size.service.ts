import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemSizeDto } from '../dto/menu-item-size/create-menu-item-size.dto';
import { UpdateMenuItemSizeDto } from '../dto/menu-item-size/update-menu-item-size.dto';
import {
  MenuItemSize,
  MenuItemSizeEntity,
} from '../entities/menu-item-size.entity';
import { MenuItemSizeValidator } from '../validators/menu-item-size.validator';

@Injectable()
export class MenuItemSizeService extends ServiceBase<MenuItemSizeEntity> {
  constructor(
    @InjectRepository(MenuItemSize)
    repo: Repository<MenuItemSize>,
    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: MenuItemSizeValidator,
  ) {
    super(
      repo,
      'MenuItemSizeService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateMenuItemSizeDto,
    manager: EntityManager,
  ): Promise<MenuItemSize> {
    const result = manager.create(MenuItemSize, {
      name: dto.name,
    });
    return await manager.save(result);
  }
  protected async updateEntity(
    dto: UpdateMenuItemSizeDto,
    manager: EntityManager,
    entity: MenuItemSize,
  ): Promise<void> {
    if (dto.name !== undefined) {
      entity.name = dto.name;
    }
    await manager.save(entity);
  }

  protected applySortBy(
    query: SelectQueryBuilder<MenuItemSize>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'name') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }
}
