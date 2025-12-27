import { EntityManager } from 'typeorm';
import { CreateOrderMenuItemDto } from '../../dto/order-menu-item/create-order-menu-item.dto';
import { OrderContainerItem } from '../../entities/order-container-item.entity';
import { OrderMenuItem } from '../../entities/order-menu-item.entity';
import { OrderContainerItemCreateInTransaction } from './order-container-item.create.transaction';

export async function OrderMenuItemCreateInTransaction(
  dto: CreateOrderMenuItemDto,
  manager: EntityManager,
): Promise<OrderMenuItem> {
  let orderedContainerItems: OrderContainerItem[] = [];
  if (dto.containerOrderMenuItems) {
    for (const nestedDto of dto.containerOrderMenuItems) {
      if (nestedDto.createDto) {
        const newItem = await OrderContainerItemCreateInTransaction(
          nestedDto.createDto,
          manager,
        );
        orderedContainerItems.push(newItem);
      } else {
        throw new Error(
          'nested orderContainerItem dtos for create OrderMenuItem has no create DTO',
        );
      }
    }
  }

  const result = manager.create(OrderMenuItem, {
    ...(dto.parentOrderId && { order: { id: dto.parentOrderId } }),
    menuItem: { id: dto.menuItemId },
    quantity: dto.quantity,
    size: { id: dto.sizeId },
    orderedContainerItems,
  });

  return result;
}
