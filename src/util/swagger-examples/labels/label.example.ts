import { handleShallow } from '../handlers/handlers';
import { menuItemExample } from '../menu-items/menu-item.example';
import { labelTypeExample } from './label-type.example';

export function labelExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(labelExample.name);
  return {
    id: 1,

    menuItem: handleShallow(shallow, fnSet, menuItemExample, false),

    imageUrl: 'url.com',

    labelType: handleShallow(shallow, fnSet, labelTypeExample, false),
  };
}
