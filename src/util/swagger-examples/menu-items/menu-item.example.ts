import { handleSetHas, handleShallow } from '../handlers/handlers';
import { menuItemCategoryExample } from './menu-item-category.example';
import { menuItemContainerItemExample } from './menu-item-container-item.example';
import { menuItemContainerOptionsExample } from './menu-item-container-options.example';
import { menuItemSizeExample } from './menu-item-size.example';

export function menuItemExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(menuItemExample.name);
  return {
    id: 1,

    itemname: 'Classic Apple',

    category: handleSetHas(shallow, fnSet, menuItemCategoryExample, false),

    validSizes: [handleShallow(shallow, fnSet, menuItemSizeExample, false)],

    definedContainerItems: [
      handleSetHas(shallow, fnSet, menuItemContainerItemExample, false),
    ],

    containerOptions: handleSetHas(
      shallow,
      fnSet,
      menuItemContainerOptionsExample,
      false,
    ),
  };
}
