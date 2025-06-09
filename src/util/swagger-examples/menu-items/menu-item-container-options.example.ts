import { handleSetHas } from '../handlers/handlers';
import { menuItemContainerRuleExample } from './menu-item-container-rule.example';
import { menuItemExample } from './menu-item.example';

export function menuItemContainerOptionsExample(
  fnSet: Set<string>,
  shallow: boolean,
) {
  fnSet.add(menuItemContainerOptionsExample.name);
  return {
    id: 1,

    parentContainer: handleSetHas(shallow, fnSet, menuItemExample, true),

    containerRules: [
      handleSetHas(shallow, fnSet, menuItemContainerRuleExample, false),
    ],

    validQuantity: 1,
  };
}
