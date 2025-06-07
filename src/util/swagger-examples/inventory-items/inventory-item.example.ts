import { inventoryItemCategoryExample } from './inventory-item-category.example';
import { inventoryItemSizeExample } from './inventory-item-size.example';

export function inventoryItemExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(inventoryItemExample.name);
  return {
    id: 1,
    itemName: 'flour',
    category:
      fnSet.has(inventoryItemCategoryExample.name) || shallow
        ? undefined
        : inventoryItemCategoryExample(fnSet),
    vendor:
      fnSet.has(inventoryItemExample.name) || shallow
        ? undefined
        : inventoryItemExample(fnSet, true),
    itemSizes:
      fnSet.has(inventoryItemSizeExample.name) || shallow
        ? undefined
        : [inventoryItemSizeExample(fnSet, true)],
  };
}
