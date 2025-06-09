import { handleSetHas, handleShallow } from '../handlers/handlers';
import { menuItemContainerOptionsExample } from './menu-item-container-options.example';
import { menuItemSizeExample } from './menu-item-size.example';
import { menuItemExample } from './menu-item.example';

export function menuItemContainerRuleExample(
  fnSet: Set<string>,
  shallow: boolean,
) {
  fnSet.add(menuItemContainerRuleExample.name);
  return {
    id: 1,

    parentContainerOption: handleSetHas(
      shallow,
      fnSet,
      menuItemContainerOptionsExample,
      true,
    ),

    validItem: handleShallow(shallow, fnSet, menuItemExample, false),

    validSizes: [handleShallow(shallow, fnSet, menuItemSizeExample, false)],
  };
}
