import { menuItemContainerOptionsExample } from './menu-item-container-options.example';
import { menuItemSizeExample } from './menu-item-size.example';
import { menuItemExample } from './menu-item.example';

export function menuItemContainerRuleExample(fnSet: Set<string>) {
  fnSet.add(menuItemContainerRuleExample.name);
  return {
    id: 1,
    parentContainerOption: fnSet.has(menuItemContainerOptionsExample.name)
      ? undefined
      : menuItemContainerOptionsExample(fnSet),
    validItem: menuItemExample(fnSet),
    validSizes: [menuItemSizeExample(fnSet)],
  };
}
