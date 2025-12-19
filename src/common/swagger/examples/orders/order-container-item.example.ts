import { handleSetHas, handleShallow } from '../handlers/handlers';
import { menuItemSizeExample } from '../menu-items/menu-item-size.example';
import { menuItemExample } from '../menu-items/menu-item.example';
import { orderMenuItemExample } from './order-menu-item.example';

export function orderContainerItemExample(
  fnSet: Set<string>,
  shallow: boolean,
) {
  fnSet.add(orderContainerItemExample.name);
  return {
    id: 1,

    parentOrderItem: handleSetHas(shallow, fnSet, orderMenuItemExample, true),

    containedItem: handleShallow(shallow, fnSet, menuItemExample, false),

    containedItemSize: handleShallow(
      shallow,
      fnSet,
      menuItemSizeExample,
      false,
    ),

    quantity: 2,
  };
}
