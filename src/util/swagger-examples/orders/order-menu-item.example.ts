import { menuItemSizeExample } from '../menu-items/menu-item-size.example';
import { menuItemExample } from '../menu-items/menu-item.example';
import { orderContainerItemExample } from './order-container-item.example';
import { orderExample } from './order.example';

export function orderMenuItemExample(fnSet: Set<string>) {
  fnSet.add(orderMenuItemExample.name);
  return {
    id: 1,
    order: fnSet.has(orderExample.name) ? undefined : orderExample(fnSet),
    menuItem: menuItemExample(fnSet),
    quantity: 2,
    size: menuItemSizeExample(fnSet),
    orderedContainerItems: fnSet.has(orderContainerItemExample.name)
      ? undefined
      : orderContainerItemExample(fnSet),
  };
}
