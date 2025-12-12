import { EntityManager } from 'typeorm';
import { MenuItemSize } from '../../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../../menu-items/menu-items.module';
import { UpdateOrderMenuItemDto } from '../../dto/order-menu-item/update-order-menu-item.dto';
import { OrderContainerItem } from '../../entities/order-container-item.entity';
import { OrderMenuItem } from '../../entities/order-menu-item.entity';
import { OrderContainerItemCreateInTransaction } from './order-container-item.create.transaction';
import { OrderContainerItemUpdateInTransaction } from './order-container-item.update.transaction';

export async function OrderMenuItemUpdateInTransaction(
  dto: UpdateOrderMenuItemDto,
  manager: EntityManager,
  entity: OrderMenuItem,
): Promise<void> {
  if (dto.menuItemId !== undefined) {
    entity.menuItem = manager.create(MenuItem, {
      id: dto.menuItemId,
    });
  }

  if (dto.menuItemSizeId !== undefined) {
    entity.size = manager.create(MenuItemSize, {
      id: dto.menuItemSizeId,
    });
  }

  if (dto.quantity !== undefined) {
    entity.quantity = dto.quantity;
  }

  if (dto.orderedItemContainerDtos) {
    const existingItems = manager.find(OrderContainerItem, {
      where: { parentOrderItem: { id: entity.id } },
    });
    const existingMap = new Map((await existingItems).map((i) => [i.id, i]));

    for (const nestedDto of dto.orderedItemContainerDtos) {
      if (nestedDto.createDto) {
        const newItem = await OrderContainerItemCreateInTransaction(
          nestedDto.createDto,
          manager,
        );
        existingMap.set(newItem.id, newItem);
      } else if (nestedDto.updateDto && nestedDto.id) {
        const toUpdate = existingMap.get(nestedDto.id);
        if (!toUpdate) {
          throw new Error(
            `OrderContainerItem with id ${nestedDto.id} not found`,
          );
        }
        await OrderContainerItemUpdateInTransaction(
          nestedDto.updateDto,
          manager,
          toUpdate,
        );
      } else {
        throw new Error(
          'Updating OrderMenuItem: nested OrderMenuItemContainer dto contains neither a create dto or update dto with id',
        );
      }
    }
    entity.containerItems = Array.from(existingMap.values());
  }
}
