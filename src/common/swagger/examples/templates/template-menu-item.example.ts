import { handleSetHas, handleShallow } from '../handlers/handlers';
import { menuItemExample } from '../menu-items/menu-item.example';
import { templateExample } from './template.example';

export function templateMenuItemExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(templateMenuItemExample.name);
  return {
    id: 1,

    displayName: 'CLAPPLE',

    menuItem: handleShallow(shallow, fnSet, menuItemExample, false),

    tablePosIndex: 0,

    parentTemplate: handleSetHas(shallow, fnSet, templateExample, true),
  };
}
