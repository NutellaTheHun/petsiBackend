import { handleSetHas, handleShallow } from '../handlers/handlers';
import { menuItemCategoryExample } from './menu-item-category.example';
import { menuItemContainerItemExample } from './menu-item-container-item.example';
import { menuItemSizeExample } from './menu-item-size.example';

export function menuItemExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(menuItemExample.name);
  return {
    id: 1,

    createdAt: new Date(),

    updatedAt: new Date(),

    type: 'container',

    name: 'Classic Apple',

    category: handleSetHas(shallow, fnSet, menuItemCategoryExample, false),

    sizes: [handleShallow(shallow, fnSet, menuItemSizeExample, false)],

    containerMenuItems: [
      handleSetHas(shallow, fnSet, menuItemContainerItemExample, false),
    ],

    variableMaxAmount: 6,
  };
}
