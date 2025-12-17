import { EntityManager } from 'typeorm';
import { MenuItemSize } from '../../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../../menu-items/menu-items.module';
import { UpdateOrderContainerItemDto } from '../../dto/order-container-item/update-order-container-item.dto';
import { OrderContainerItem } from '../../entities/order-container-item.entity';

export async function OrderContainerItemUpdateInTransaction(
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
