import { handleSetHas } from '../handlers/handlers';
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

    inventoryArea: handleSetHas(shallow, fnSet, inventoryAreaExample, true),

    countedItems: [
      handleSetHas(shallow, fnSet, inventoryAreaItemExample, false),
    ],
  };
}
