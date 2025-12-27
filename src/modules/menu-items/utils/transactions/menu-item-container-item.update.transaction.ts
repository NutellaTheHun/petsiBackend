import { EntityManager } from 'typeorm';
import { UpdateMenuItemContainerItemDto } from '../../dto/menu-item-container-item/update-menu-item-container-item.dto';
import { MenuItemContainerItem } from '../../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../../entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items.module';

export async function MenuItemContainerItemUpdateInTransaction(
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
