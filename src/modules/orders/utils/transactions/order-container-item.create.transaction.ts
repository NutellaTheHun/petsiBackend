import { EntityManager } from 'typeorm';
import { CreateOrderContainerItemDto } from '../../dto/order-container-item/create-order-container-item.dto';
import { OrderContainerItem } from '../../entities/order-container-item.entity';

export async function OrderContainerItemCreateInTransaction(
  dto: CreateOrderContainerItemDto,
  manager: EntityManager,
): Promise<OrderContainerItem> {
  const result = manager.create(OrderContainerItem, {
    ...(dto.parentOrderMenuItemId && {
      parentOrderItem: { id: dto.parentOrderMenuItemId },
    }),
    containedItem: { id: dto.containedMenuItemId },
    containedItemSize: { id: dto.containedMenuItemSizeId },
    quantity: dto.quantity,
  });
  return result;
}
