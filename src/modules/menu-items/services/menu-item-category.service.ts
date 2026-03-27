import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ChangeDetectorBase } from '../../../common/base/change-detector.base';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemCategoryDto } from '../dto/menu-item-category/create-menu-item-category.dto';
import { UpdateMenuItemCategoryDto } from '../dto/menu-item-category/update-menu-item-category.dto';
import {
  MenuItemCategory,
  MenuItemCategoryEntity,
} from '../entities/menu-item-category.entity';
import { MenuItemCategoryChangeDetector } from '../utils/change-detectors/menu-item-category.change-detector';
import { MenuItemCategoryValidator } from '../validators/menu-item-category.validator';

@Injectable()
export class MenuItemCategoryService extends ServiceBase<MenuItemCategoryEntity> {
  constructor(
    @InjectRepository(MenuItemCategory)
    repo: Repository<MenuItemCategory>,
    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: MenuItemCategoryValidator,
    private readonly menuItemCategoryChangeDetector: MenuItemCategoryChangeDetector,
  ) {
    super(
      repo,
      'MenuItemCategoryService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateMenuItemCategoryDto,
    manager: EntityManager,
  ): Promise<MenuItemCategory> {
    const result = manager.create(MenuItemCategory, {
      name: dto.name,
    });
    return await manager.save(result);
  }
  protected async updateEntity(
    dto: UpdateMenuItemCategoryDto,
    manager: EntityManager,
    entity: MenuItemCategory,
  ): Promise<void> {
    if (dto.name !== undefined) {
      entity.name = dto.name;
    }
    await manager.save(entity);
  }

  protected applySortBy(
    query: SelectQueryBuilder<MenuItemCategory>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'name') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }

  protected getChangeDetector():
    | ChangeDetectorBase<MenuItemCategory, UpdateMenuItemCategoryDto>
    | undefined {
    return this.menuItemCategoryChangeDetector;
  }
}
