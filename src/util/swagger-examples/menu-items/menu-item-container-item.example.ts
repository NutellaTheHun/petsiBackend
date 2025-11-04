import { handleSetHas, handleShallow } from '../handlers/handlers';
import { menuItemSizeExample } from './menu-item-size.example';
import { menuItemExample } from './menu-item.example';

export function menuItemContainerItemExample(
  fnSet: Set<string>,
  shallow: boolean,
) {
  fnSet.add(menuItemContainerItemExample.name);
  return {
    id: 1,

    parent: handleSetHas(shallow, fnSet, menuItemExample, true),

    parentItemSize: handleShallow(shallow, fnSet, menuItemSizeExample, true),

    containedItem: handleSetHas(shallow, fnSet, menuItemExample, false),

    containedItemSize: handleShallow(
      shallow,
      fnSet,
      menuItemSizeExample,
      false,
    ),

    quantity: 1,
  };
}
