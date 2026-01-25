import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  MoreThanOrEqual,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { OrderContainerItem } from '../../orders/entities/order-container-item.entity';
import { OrderMenuItem } from '../../orders/entities/order-menu-item.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem, MenuItemEntity } from '../entities/menu-item.entity';
import { MenuItemContainerItemComposer } from '../utils/composers/menu-item-container-item.composer';
import { MENU_ITEM_TYPES } from '../utils/menu-item-type';
import { MenuItemValidator } from '../validators/menu-item.validator';

@Injectable()
export class MenuItemService extends ServiceBase<MenuItemEntity> {
  constructor(
    @InjectRepository(MenuItem)
    repo: Repository<MenuItem>,
    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: MenuItemValidator,

    @InjectRepository(OrderMenuItem)
    private readonly orderMenuItemRepo: Repository<OrderMenuItem>,
    @InjectRepository(OrderContainerItem)
    private readonly orderContainerItemRepo: Repository<OrderContainerItem>,
    private readonly containerItemComposer: MenuItemContainerItemComposer,
  ) {
    super(repo, 'MenuItemService', requestContextService, logger, validator);
  }

  protected async createEntity(
    dto: CreateMenuItemDto,
    manager: EntityManager,
  ): Promise<MenuItem> {
    const entity = manager.create(MenuItem, {
      type: dto.type,
      category: dto.categoryId ? { id: dto.categoryId } : undefined,
      name: dto.name,
      sizes: dto.sizeIds.map((id) => manager.create(MenuItemSize, { id })),
      variableMaxAmount: dto.variableMaxAmount,
    });

    const savedResult = await manager.save(entity);

    if (dto.containerMenuItems && dto.containerMenuItems?.length) {
      savedResult.containerMenuItems =
        await this.containerItemComposer.composeManyNestedEntity(
          dto.containerMenuItems,
          manager,
          [],
          {
            parentMenuItemId:
              savedResult.id /*, parentItemSizeId: savedResult.sizes[0]*/,
          },
        );
    }

    return await manager.save(savedResult);
  }

  protected async updateEntity(
    dto: UpdateMenuItemDto,
    manager: EntityManager,
    entity: MenuItem,
  ): Promise<void> {
    if (dto.categoryId !== undefined) {
      if (dto.categoryId === null) {
        entity.category = null;
      } else {
        entity.category = manager.create(MenuItemCategory, {
          id: dto.categoryId,
        });
      }
    }

    if (dto.name !== undefined) {
      entity.name = dto.name;
    }

    if (dto.type !== undefined) {
      entity.type = dto.type;

      if (dto.type === MENU_ITEM_TYPES.SINGLE) {
        entity.containerMenuItems = [];
        entity.variableMaxAmount = null;
        await this.syncOrderMenuItems(entity.id);
      }
    }

    if (dto.variableMaxAmount !== undefined) {
      entity.variableMaxAmount = dto.variableMaxAmount;
    }

    if (dto.sizeIds?.length) {
      entity.sizes = dto.sizeIds.map((id) =>
        manager.create(MenuItemSize, { id }),
      );
      // handle currently ordered items with now invalid sizes?
    }

    if (dto.containerMenuItems?.length) {
      const existingItems = await manager.find(MenuItemContainerItem, {
        where: { parentMenuItem: { id: entity.id } },
      });
      entity.containerMenuItems =
        await this.containerItemComposer.composeManyNestedEntity(
          dto.containerMenuItems,
          manager,
          existingItems,
          {
            parentMenuItemId: entity.id /*, parentItemSizeId: entity.sizes[0]*/,
          },
        );
    }
    await manager.save(entity);
  }

  protected applySearch(
    query: SelectQueryBuilder<MenuItem>,
    search: string,
  ): void {
    query.andWhere('(LOWER(entity.name) LIKE :search)', {
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
    if (sortBy === 'name') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
    if (sortBy === 'category') {
      query.leftJoinAndSelect('entity.category', 'menuItemCategory');
      query.orderBy(`menuItemCategory.name`, sortOrder, 'NULLS LAST');
    }
  }

  /**
   * Update all current orders with menuItem that used to be of type container to single by removing the contained items within the ordered item
   * TODO: is this to harsh? If a menuItem is switched to single, cant the system just ignore the container items?
   * If user accidentally switches a menuItem to single, this would irreversibly delete the container items.
   * Would atleast need a warning and/or just ignore the container items.
   */
  private async syncOrderMenuItems(id: number) {
    const activeOrderItems = await this.orderMenuItemRepo.find({
      where: {
        menuItem: { id },
        parentOrder: {
          isFrozen: false,
          fulfillmentDate: MoreThanOrEqual(new Date()),
        },
      },
      relations: ['order', 'containerItems'],
    });

    for (const orderItem of activeOrderItems) {
      await this.orderContainerItemRepo.delete({
        parentOrderMenuItem: { id: orderItem.id },
      });
    }
  }
}
