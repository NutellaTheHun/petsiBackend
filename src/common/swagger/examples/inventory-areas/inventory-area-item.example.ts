import { handleSetHas, handleShallow } from '../handlers/handlers';
import { inventoryItemSizeExample } from '../inventory-items/inventory-item-size.example';
import { inventoryItemExample } from '../inventory-items/inventory-item.example';
import { inventoryAreaCountExample } from './inventory-area-count.example';

export function inventoryAreaItemExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(inventoryAreaItemExample.name);
  return {
    id: 1,

    parentInventoryCount: handleSetHas(
      shallow,
      fnSet,
      inventoryAreaCountExample,
      true,
    ),

    countedItem: handleShallow(shallow, fnSet, inventoryItemExample, false),

    amount: 1,

    countedItemSize: handleShallow(
      shallow,
      fnSet,
      inventoryItemSizeExample,
      false,
    ),
  };
}
