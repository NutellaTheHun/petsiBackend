import { handleSetHas } from '../handlers/handlers';
import { inventoryAreaCountExample } from './inventory-area-count.example';

export function inventoryAreaExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(inventoryAreaExample.name);
  return {
    id: 1,

    name: 'dry storage',

    inventoryCounts: [
      handleSetHas(shallow, fnSet, inventoryAreaCountExample, false),
    ],
  };
}
