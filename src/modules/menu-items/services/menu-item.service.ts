import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { MenuItemBuilder } from '../builders/menu-item.builder';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { MenuItem, MenuItemEntity } from '../entities/menu-item.entity';
import { MenuItemValidator } from '../validators/menu-item.validator';

@Injectable()
export class MenuItemService extends ServiceBase<MenuItemEntity> {
  protected createEntity(dto: CreateMenuItemDto): MenuItem {
    throw new Error('Method not implemented.');
  }
  protected updateEntity(entity: MenuItem, dto: CreateMenuItemDto): MenuItem {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(MenuItem)
    private readonly repo: Repository<MenuItem>,

    @Inject(forwardRef(() => MenuItemBuilder))
    builder: MenuItemBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: MenuItemValidator,
  ) {
    super(
      repo,
      builder,
      'MenuItemService',
      requestContextService,
      logger,
      validator,
    );
  }

  async findOneByName(
    name: string,
    relations?: Array<keyof MenuItem>,
  ): Promise<MenuItem | null> {
    return await this.repo.findOne({
      where: { itemName: name },
      relations: relations,
    });
  }

  protected applySearch(
    query: SelectQueryBuilder<MenuItem>,
    search: string,
  ): void {
    query.andWhere('(LOWER(entity.itemName) LIKE :search)', {
      search: `%${search.toLowerCase()}%`,
    });
  }

  protected applyFilters(
    query: SelectQueryBuilder<MenuItem>,
    filters: Record<string, string[]>,
  ): void {
    if (filters.category && filters.category.length > 0) {
      query.andWhere('entity.category IN (:...categories)', {
        categories: filters.category,
      });
    }
  }

  protected applySortBy(
    query: SelectQueryBuilder<MenuItem>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'itemName') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
    if (sortBy === 'category') {
      query.leftJoinAndSelect('entity.category', 'menuItemCategory');
      query.orderBy(`menuItemCategory.categoryName`, sortOrder, 'NULLS LAST');
    }
  }
}
