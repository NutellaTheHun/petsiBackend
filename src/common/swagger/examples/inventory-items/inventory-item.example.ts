import { handleSetHas } from '../handlers/handlers';
import { inventoryItemCategoryExample } from './inventory-item-category.example';
import { inventoryItemSizeExample } from './inventory-item-size.example';

export function inventoryItemExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(inventoryItemExample.name);
  return {
    id: 1,

    name: 'flour',

    category: handleSetHas(shallow, fnSet, inventoryItemCategoryExample, false),

    vendor: handleSetHas(shallow, fnSet, inventoryItemExample, false),

    sizes: [handleSetHas(shallow, fnSet, inventoryItemSizeExample, false)],
  };
}
