import { EntityManager } from 'typeorm';
import { CreateMenuItemContainerItemDto } from '../../dto/menu-item-container-item/create-menu-item-container-item.dto';
import { MenuItemContainerItem } from '../../entities/menu-item-container-item.entity';

export async function MenuItemContainerItemCreateInTransaction(
  dto: CreateMenuItemContainerItemDto,
  manager: EntityManager,
): Promise<MenuItemContainerItem> {
  const result = manager.create(MenuItemContainerItem, {
    ...(dto.parentMenuItemId && { parent: { id: dto.parentMenuItemId } }),
    parentItemSize: { id: dto.parentItemSizeId },
    containedItem: { id: dto.containedMenuItemId },
    containedItemSize: { id: dto.containedItemSizeId },
    quantity: dto.quantity,
  });
  return result;
}
