import { inventoryAreaItemExample } from './inventory-area-item.example';
import { inventoryAreaExample } from './inventory-area.example';

export function inventoryAreaCountExample(
  fnSet: Set<string>,
  shallow: boolean,
) {
  fnSet.add(inventoryAreaCountExample.name);
  return {
    id: 1,
    countDate: new Date(),
    inventoryArea:
      fnSet.has(inventoryAreaExample.name) || shallow
        ? undefined
        : inventoryAreaExample(fnSet, true),
    countedItems:
      fnSet.has(inventoryAreaItemExample.name) || shallow
        ? undefined
        : inventoryAreaItemExample(fnSet, true),
  };
}
