import { menuItemSizeExample } from '../menu-items/menu-item-size.example';
import { menuItemExample } from '../menu-items/menu-item.example';
import { orderMenuItemExample } from './order-menu-item.example';

export function orderContainerItemExample(fnSet: Set<string>) {
  fnSet.add(orderContainerItemExample.name);
  return {
    id: 1,
    parentOrderItem: fnSet.has(orderMenuItemExample.name)
      ? undefined
      : orderMenuItemExample(fnSet),
    containedItem: menuItemExample(fnSet),
    containedItemSize: menuItemSizeExample(fnSet),
    quantity: 2,
  };
}
