import { menuItemCategoryExample } from './menu-item-category.example';
import { menuItemContainerItemExample } from './menu-item-container-item.example';
import { menuItemContainerOptionsExample } from './menu-item-container-options.example';
import { menuItemSizeExample } from './menu-item-size.example';

export function menuItemExample(fnSet: Set<string>) {
  fnSet.add(menuItemExample.name);
  return {
    id: 1,
    category: fnSet.has(menuItemCategoryExample.name)
      ? undefined
      : menuItemCategoryExample(fnSet),
    itemname: 'Classic Apple',
    validSizes: [menuItemSizeExample(fnSet)],
    definedContainerItems: fnSet.has(menuItemContainerItemExample.name)
      ? undefined
      : [menuItemContainerItemExample(fnSet)],
    containerOptions: fnSet.has(menuItemContainerOptionsExample.name)
      ? undefined
      : [menuItemContainerOptionsExample(fnSet)],
  };
}
