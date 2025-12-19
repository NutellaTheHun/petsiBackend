import { handleSetHas } from '../handlers/handlers';
import { templateMenuItemExample } from './template-menu-item.example';

export function templateExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(templateExample.name);
  return {
    id: 1,

    templateName: 'Summer Pies',

    isPie: true,

    templateItems: [
      handleSetHas(shallow, fnSet, templateMenuItemExample, false),
    ],
  };
}
