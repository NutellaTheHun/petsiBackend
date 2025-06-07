import { menuItemContainerRuleExample } from './menu-item-container-rule.example';
import { menuItemExample } from './menu-item.example';

export function menuItemContainerOptionsExample(fnSet: Set<string>) {
  fnSet.add(menuItemContainerOptionsExample.name);
  return {
    id: 1,
    parentContainer: fnSet.has(menuItemExample.name)
      ? undefined
      : menuItemExample(fnSet),
    containerRules: fnSet.has(menuItemContainerRuleExample.name)
      ? undefined
      : menuItemContainerRuleExample(fnSet),
    validQuantity: 1,
  };
}
