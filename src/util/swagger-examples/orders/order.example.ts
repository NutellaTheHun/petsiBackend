import { orderCategoryExample } from './order-category.example';
import { orderMenuItemExample } from './order-menu-item.example';

export function orderExample(fnSet: Set<string>) {
  fnSet.add(orderExample.name);
  return {
    id: 1,
    orderCategory: fnSet.has(orderCategoryExample.name)
      ? undefined
      : orderCategoryExample(fnSet),
    recipient: 'alberto',
    createdAt: new Date(),
    updatedAt: new Date(),
    fulfilllmentType: 'delivery',
    fulfillmentContactName: 'not alberto',
    deliveryAddress: '123 main st',
    phoneNumber: '555-155-2194',
    email: 'email@email.com',
    note: 'instructions',
    isFrozen: false,
    isWeekly: true,
    weeklyFulfillment: 'monday',
    orderedItems: fnSet.has(orderMenuItemExample.name)
      ? undefined
      : orderMenuItemExample(fnSet),
  };
}
