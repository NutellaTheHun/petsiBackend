import { EntityManager, EntityTarget } from 'typeorm';
import { ComposerBase } from '../../../../common/base/composer.base';
import { MenuItemSize } from '../../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../../menu-items/entities/menu-item.entity';
import { CreateOrderContainerItemDto } from '../../dto/order-container-item/create-order-container-item.dto';
import { NestedCreateOrderContainerItemDto } from '../../dto/order-container-item/nested-create-order-container-item.dto';
import { UpdateOrderContainerItemDto } from '../../dto/order-container-item/update-order-container-item.dto';
import {
  OrderContainerItem,
  OrderContainerItemEntity,
} from '../../entities/order-container-item.entity';

export class OrderContainerItemComposer extends ComposerBase<OrderContainerItemEntity> {
  protected entityClass: EntityTarget<OrderContainerItem>;

  protected async createInTransaction(
    dto: CreateOrderContainerItemDto,
    manager: EntityManager,
  ): Promise<OrderContainerItem> {
    const result = await manager.create(OrderContainerItem, {
      parentOrderMenuItem: { id: dto.parentOrderMenuItemId },
      containedMenuItem: { id: dto.containedMenuItemId },
      containedItemSize: { id: dto.containedItemSizeId },
      quantity: dto.quantity,
    });
    return result;
  }

  protected async updateInTransaction(
    dto: UpdateOrderContainerItemDto,
    manager: EntityManager,
    entity: OrderContainerItem,
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
    dto: NestedCreateOrderContainerItemDto,
    context?: ResolverContext,
  ): CreateOrderContainerItemDto {
    if (!context?.parentOrderMenuItemId) {
      throw new Error('Parent order menu item id is required');
    }
    if (!context?.parentMenuItemId) {
      throw new Error('Parent menu item id is required');
    }
    if (!context?.parentMenuItemSizeId) {
      throw new Error('Parent menu item size id is required');
    }

    return {
      containedMenuItemId: dto.containedMenuItemId,
      containedItemSizeId: dto.containedItemSizeId,
      quantity: dto.quantity,
      parentOrderMenuItemId: context.parentOrderMenuItemId,
    };
  }
}
