import { menuItemExample } from './menu-item.example';

export function menuItemCategoryExample(fnSet: Set<string>) {
  fnSet.add(menuItemCategoryExample.name);
  return {
    id: 1,
    categoryName: 'pie',
    categoryItem: fnSet.has(menuItemExample.name)
      ? undefined
      : menuItemExample(fnSet),
  };
}
