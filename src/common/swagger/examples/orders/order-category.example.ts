import { handleSetHas } from '../handlers/handlers';
import { orderMenuItemExample } from './order-menu-item.example';

export function orderCategoryExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(orderCategoryExample.name);
  return {
    id: 1,

    name: 'wholesale',

    orderItems: [handleSetHas(shallow, fnSet, orderMenuItemExample, false)],
  };
}
