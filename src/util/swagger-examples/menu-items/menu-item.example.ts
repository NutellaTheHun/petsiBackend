import { handleSetHas, handleShallow } from '../handlers/handlers';
import { menuItemCategoryExample } from './menu-item-category.example';
import { menuItemContainerItemExample } from './menu-item-container-item.example';
import { menuItemContainerRuleExample } from './menu-item-container-rule.example';
import { menuItemSizeExample } from './menu-item-size.example';

export function menuItemExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(menuItemExample.name);
  return {
    id: 1,

    type: 'variable_container',

    itemname: 'Classic Apple',

    category: handleSetHas(shallow, fnSet, menuItemCategoryExample, false),

    validSizes: [handleShallow(shallow, fnSet, menuItemSizeExample, false)],

    fixedContents: [
      handleSetHas(shallow, fnSet, menuItemContainerItemExample, false),
    ],

    variableRules: handleSetHas(
      shallow,
      fnSet,
      menuItemContainerRuleExample,
      false,
    ),

    variableMaxAmount: 6,
  };
}
