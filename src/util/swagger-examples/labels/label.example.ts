import { menuItemExample } from '../menu-items/menu-item.example';
import { labelTypeExample } from './label-type.example';

export function labelExample(fnSet: Set<string>) {
  fnSet.add(labelExample.name);
  return {
    id: 1,
    menuItem: menuItemExample(fnSet),
    imageUrl: 'url.com',
    labelType: labelTypeExample(fnSet),
  };
}
