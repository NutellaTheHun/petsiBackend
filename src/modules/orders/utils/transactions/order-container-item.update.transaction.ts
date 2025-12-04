import { EntityManager } from 'typeorm';
import { MenuItemSize } from '../../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../../menu-items/menu-items.module';
import { UpdateOrderContainerItemDto } from '../../dto/order-container-item/update-order-container-item.dto';
import { OrderContainerItem } from '../../entities/order-container-item.entity';
import { OrderMenuItem } from '../../entities/order-menu-item.entity';

export async function OrderContainerItemUpdateInTransaction(
  dto: UpdateOrderContainerItemDto,
  manager: EntityManager,
  entity: OrderContainerItem,
): Promise<void> {
  if (dto.containedMenuItemId) {
    entity.containedItem = manager.create(MenuItem, {
      id: dto.containedMenuItemId,
    });
  }

  if (dto.containedMenuItemSizeId) {
    entity.containedItemSize = manager.create(MenuItemSize, {
      id: dto.containedMenuItemSizeId,
    });
  }

  if (dto.parentContainerMenuItemId) {
    entity.parentOrderItem = manager.create(OrderMenuItem, {
      id: dto.parentContainerMenuItemId,
    });
  }

  if (dto.quantity) {
    entity.quantity = dto.quantity;
  }
}
