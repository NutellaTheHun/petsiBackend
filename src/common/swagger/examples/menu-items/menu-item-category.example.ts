import { handleSetHas } from '../handlers/handlers';
import { menuItemExample } from './menu-item.example';

export function menuItemCategoryExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(menuItemCategoryExample.name);
  return {
    id: 1,

    categoryName: 'pie',

    categoryItems: [handleSetHas(shallow, fnSet, menuItemExample, false)],
  };
}
