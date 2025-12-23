import { handleSetHas } from '../handlers/handlers';
import { menuItemExample } from './menu-item.example';

export function menuItemCategoryExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(menuItemCategoryExample.name);
  return {
    id: 1,

    name: 'pie',

    menuItems: [handleSetHas(shallow, fnSet, menuItemExample, false)],
  };
}
