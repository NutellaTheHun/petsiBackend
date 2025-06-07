import { orderMenuItemExample } from './order-menu-item.example';

export function orderCategoryExample(fnSet: Set<string>) {
  fnSet.add(orderCategoryExample.name);
  return {
    id: 1,
    categoryName: 'wholesale',
    orders: fnSet.has(orderMenuItemExample.name)
      ? undefined
      : orderMenuItemExample(fnSet),
  };
}
