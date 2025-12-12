import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { MenuItemBuilder } from '../builders/menu-item.builder';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem, MenuItemEntity } from '../entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../utils/menu-item-type';
import { MenuItemContainerItemCreateInTransaction } from '../utils/transactions/menu-item-container-item.create.transaction';
import { MenuItemContainerItemUpdateInTransaction } from '../utils/transactions/menu-item-container-item.update.transaction';
import { MenuItemValidator } from '../validators/menu-item.validator';

@Injectable()
export class MenuItemService extends ServiceBase<MenuItemEntity> {
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

  protected async createEntity(
    dto: CreateMenuItemDto,
    manager: EntityManager,
  ): Promise<MenuItem> {
    let containerItems: MenuItemContainerItem[] = [];
    if (dto.containerMenuItemDtos?.length) {
      for (const nestedDto of dto.containerMenuItemDtos) {
        if (nestedDto.createDto) {
          const newItem = await MenuItemContainerItemCreateInTransaction(
            nestedDto.createDto,
            manager,
          );
          containerItems.push(newItem);
        } else {
          throw new Error('nested MenuItemContainerItem create dto is null');
        }
      }
    }

    const result = manager.create(MenuItem, {
      type: dto.type,
      ...(dto.categoryId && { category: { id: dto.categoryId } }),
      itemName: dto.itemName,
      validSizes: dto.validSizeIds.map((id) =>
        manager.create(MenuItemSize, { id }),
      ),
      containerItems,
      variableMaxAmount: dto.variableMaxAmount,
    });

    return result;
  }

  protected async updateEntity(
    dto: UpdateMenuItemDto,
    manager: EntityManager,
    entity: MenuItem,
  ): Promise<void> {
    if (dto.categoryId !== undefined) {
      entity.category = manager.create(MenuItemCategory, {
        id: dto.categoryId,
      });
    }

    if (dto.itemName !== undefined) {
      entity.itemName = dto.itemName;
    }

    if (dto.type !== undefined) {
      entity.type = dto.type;

      if (dto.type === MENU_ITEM_TYPES.SINGLE) {
        entity.containerItems = [];
        entity.variableMaxAmount = null;
      }
    }

    if (dto.variableMaxAmount !== undefined) {
      entity.variableMaxAmount = dto.variableMaxAmount;
    }

    if (dto.validSizeIds !== undefined) {
      entity.validSizes = dto.validSizeIds.map((id) =>
        manager.create(MenuItemSize, { id }),
      );
    }

    if (dto.containerMenuItemDtos?.length) {
      const existingItems = await manager.find(MenuItemContainerItem, {
        where: { parent: { id: entity.id } },
      });
      const existingMap = new Map(existingItems.map((i) => [i.id, i]));

      for (const nestedDto of dto.containerMenuItemDtos) {
        if (nestedDto.createDto) {
          const newItem = await MenuItemContainerItemCreateInTransaction(
            nestedDto.createDto,
            manager,
          );
          existingMap.set(newItem.id, newItem);
        } else if (nestedDto.updateDto && nestedDto.id) {
          const toUpdate = existingMap.get(nestedDto.id);
          if (!toUpdate) {
            throw new Error(
              `MenuItemContainerItem to update with id ${nestedDto.id} was not found`,
            );
          }
          await MenuItemContainerItemUpdateInTransaction(
            nestedDto.updateDto,
            manager,
            toUpdate,
          );
        } else {
          throw new Error(
            'nested MenuItemContainerItem dto for update MenuItem has neither create or update dto (with id)',
          );
        }
      }
      entity.containerItems = Array.from(existingMap.values());
    }
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
