import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { MenuItemCategoryBuilder } from '../builders/menu-item-category.builder';
import { CreateMenuItemCategoryDto } from '../dto/menu-item-category/create-menu-item-category.dto';
import { UpdateMenuItemCategoryDto } from '../dto/menu-item-category/update-menu-item-category.dto';
import {
  MenuItemCategory,
  MenuItemCategoryEntity,
} from '../entities/menu-item-category.entity';
import { MenuItemCategoryValidator } from '../validators/menu-item-category.validator';

@Injectable()
export class MenuItemCategoryService extends ServiceBase<MenuItemCategoryEntity> {
  constructor(
    @InjectRepository(MenuItemCategory)
    private readonly repo: Repository<MenuItemCategory>,

    @Inject(forwardRef(() => MenuItemCategoryBuilder))
    builder: MenuItemCategoryBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: MenuItemCategoryValidator,
  ) {
    super(
      repo,
      builder,
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
      categoryName: dto.categoryName,
    });
    return result;
  }
  protected async updateEntity(
    dto: UpdateMenuItemCategoryDto,
    manager: EntityManager,
    entity: MenuItemCategory,
  ): Promise<void> {
    if (dto.categoryName !== undefined) {
      entity.categoryName = dto.categoryName;
    }
  }

  async findOneByName(
    name: string,
    relations?: Array<keyof MenuItemCategory>,
  ): Promise<MenuItemCategory | null> {
    return await this.repo.findOne({
      where: { categoryName: name },
      relations: relations,
    });
  }

  protected applySortBy(
    query: SelectQueryBuilder<MenuItemCategory>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'categoryName') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }
}
