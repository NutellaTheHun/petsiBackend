import { Injectable } from '@nestjs/common';
import { EntityManager, EntityTarget } from 'typeorm';
import { ComposerBase } from '../../../../common/base/composer.base';
import { CreateMenuItemContainerItemDto } from '../../dto/menu-item-container-item/create-menu-item-container-item.dto';
import { NestedCreateMenuItemContainerItemDto } from '../../dto/menu-item-container-item/nested-create-menu-item-container-item.dto';
import { UpdateMenuItemContainerItemDto } from '../../dto/menu-item-container-item/update-menu-item-container-item.dto';
import {
  MenuItemContainerItem,
  MenuItemContainerItemEntity,
} from '../../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../../entities/menu-item-size.entity';
import { MenuItem } from '../../entities/menu-item.entity';

@Injectable()
export class MenuItemContainerItemComposer extends ComposerBase<MenuItemContainerItemEntity> {
  protected entityClass: EntityTarget<MenuItemContainerItem>;

  protected async createInTransaction(
    dto: CreateMenuItemContainerItemDto,
    manager: EntityManager,
  ): Promise<MenuItemContainerItem> {
    const result = manager.create(MenuItemContainerItem, {
      parentMenuItem: { id: dto.parentMenuItemId },
      parentItemSize: { id: dto.parentItemSizeId },
      containedMenuItem: { id: dto.containedMenuItemId },
      containedItemSize: { id: dto.containedItemSizeId },
      quantity: dto.quantity,
    });
    return result;
  }
  protected async updateInTransaction(
    dto: UpdateMenuItemContainerItemDto,
    manager: EntityManager,
    entity: MenuItemContainerItem,
  ): Promise<void> {
    if (dto.containedMenuItemId !== undefined) {
      entity.containedMenuItem = manager.create(MenuItem, {
        id: dto.containedMenuItemId,
      });
    }

    if (dto.containedItemSizeId !== undefined) {
      entity.containedItemSize = manager.create(MenuItemSize, {
        id: dto.containedItemSizeId,
      });
    }

    if (dto.quantity !== undefined) {
      entity.quantity = dto.quantity;
    }
  }

  protected resolveCreateDto(
    dto: NestedCreateMenuItemContainerItemDto,
    context?: ResolverContext,
  ): CreateMenuItemContainerItemDto {
    if (!context?.parentMenuItemId) {
      throw new Error('Parent menu item id is required');
    }
    if (!context?.parentItemSizeId) {
      throw new Error('Parent item size id is required');
    }
    return {
      containedMenuItemId: dto.containedMenuItemId,
      containedItemSizeId: dto.containedItemSizeId,
      quantity: dto.quantity,
      parentMenuItemId: context.parentMenuItemId,
      parentItemSizeId: context.parentItemSizeId,
    };
  }
}
