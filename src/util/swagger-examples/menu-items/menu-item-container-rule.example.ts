import { handleSetHas, handleShallow } from '../handlers/handlers';
import { menuItemSizeExample } from './menu-item-size.example';
import { menuItemExample } from './menu-item.example';

export function menuItemContainerRuleExample(
  fnSet: Set<string>,
  shallow: boolean,
) {
  fnSet.add(menuItemContainerRuleExample.name);
  return {
    id: 1,

    parentMenuItem: handleSetHas(shallow, fnSet, menuItemExample, true),

    validItem: handleShallow(shallow, fnSet, menuItemExample, false),

    validSizes: [handleShallow(shallow, fnSet, menuItemSizeExample, false)],

    maxQuantity: 3,
  };
}
