import { templateMenuItemExample } from './template-menu-item.example';

export function templateExample(fnSet: Set<string>) {
  fnSet.add(templateExample.name);
  return {
    id: 1,
    templateName: 'Summer Pies',
    isPie: true,
    templateItems: fnSet.has(templateMenuItemExample.name)
      ? undefined
      : templateMenuItemExample(fnSet),
  };
}
