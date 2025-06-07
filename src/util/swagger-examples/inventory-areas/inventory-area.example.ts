import { inventoryAreaCountExample } from './inventory-area-count.example';

export function inventoryAreaExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(inventoryAreaExample.name);
  return {
    id: 1,
    areaName: 'dry storage',
    inventoryCounts:
      fnSet.has(inventoryAreaCountExample.name) || shallow
        ? undefined
        : [inventoryAreaCountExample(fnSet, true)],
  };
}
