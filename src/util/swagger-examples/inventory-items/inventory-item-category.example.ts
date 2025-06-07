import { inventoryItemExample } from './inventory-item.example';

export function inventoryItemCategoryExample(fnSet: Set<string>) {
  fnSet.add(inventoryItemCategoryExample.name);
  return {
    id: 1,
    categoryName: 'dry goods',
    categoryItems: fnSet.has(inventoryItemExample.name)
      ? undefined
      : [inventoryItemExample(fnSet, true)],
  };
}
