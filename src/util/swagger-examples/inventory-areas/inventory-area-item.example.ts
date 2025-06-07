import { inventoryItemSizeExample } from '../inventory-items/inventory-item-size.example';
import { inventoryItemExample } from '../inventory-items/inventory-item.example';
import { inventoryAreaCountExample } from './inventory-area-count.example';

export function inventoryAreaItemExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(inventoryAreaItemExample.name);
  return {
    id: 1,
    parentInventoryCount:
      fnSet.has(inventoryAreaCountExample.name) || shallow
        ? undefined
        : inventoryAreaCountExample(fnSet, true),
    countedItem: inventoryItemExample(fnSet, true),
    amount: 1,
    countedItemSize: inventoryItemSizeExample(fnSet, true),
  };
}
