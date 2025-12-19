import { handleSetHas, handleShallow } from '../handlers/handlers';
import { menuItemSizeExample } from '../menu-items/menu-item-size.example';
import { menuItemExample } from '../menu-items/menu-item.example';
import { orderContainerItemExample } from './order-container-item.example';
import { orderExample } from './order.example';

export function orderMenuItemExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(orderMenuItemExample.name);
  return {
    id: 1,

    order: handleSetHas(shallow, fnSet, orderExample, true),

    menuItem: handleShallow(shallow, fnSet, menuItemExample, false),

    quantity: 2,

    size: handleShallow(shallow, fnSet, menuItemSizeExample, false),

    orderedContainerItems: [
      handleSetHas(shallow, fnSet, orderContainerItemExample, false),
    ],
  };
}
