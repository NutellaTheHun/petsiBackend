import { menuItemSizeExample } from './menu-item-size.example';
import { menuItemExample } from './menu-item.example';

export function menuItemContainerItemExample(fnSet: Set<string>) {
  fnSet.add(menuItemContainerItemExample.name);
  return {
    id: 1,
    parentContainer: fnSet.has(menuItemExample.name)
      ? undefined
      : menuItemExample(fnSet),
    parentContainerSize: menuItemSizeExample(fnSet),
    containedItem: fnSet.has(menuItemExample.name)
      ? undefined
      : menuItemExample(fnSet),
    containedItemSize: menuItemSizeExample(fnSet),
    quantity: 1,
  };
}
