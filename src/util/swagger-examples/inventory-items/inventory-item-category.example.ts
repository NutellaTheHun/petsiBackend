import { handleSetHas } from '../handlers/handlers';
import { inventoryItemExample } from './inventory-item.example';

export function inventoryItemCategoryExample(
  fnSet: Set<string>,
  shallow: boolean,
) {
  fnSet.add(inventoryItemCategoryExample.name);
  return {
    id: 1,

    categoryName: 'dry goods',

    categoryItems: [handleSetHas(shallow, fnSet, inventoryItemExample, false)],
  };
}
