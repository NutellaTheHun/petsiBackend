import { menuItemExample } from '../menu-items/menu-item.example';
import { templateExample } from './template.example';

export function templateMenuItemExample(fnSet: Set<string>) {
  fnSet.add(templateMenuItemExample.name);
  return {
    id: 1,
    displayName: 'CLAPPLE',
    menuItem: menuItemExample(fnSet),
    tablePosIndex: 0,
    parentTemplate: fnSet.has(templateExample.name)
      ? undefined
      : templateExample(fnSet),
  };
}
