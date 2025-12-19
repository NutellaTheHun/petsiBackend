import { handleSetHas, handleShallow } from '../handlers/handlers';
import { unitOfMeasureExample } from '../unit-of-measure/unit-of-measure.example';
import { inventoryItemPackageExample } from './inventory-item-package.example';
import { inventoryItemExample } from './inventory-item.example';

export function inventoryItemSizeExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(inventoryItemSizeExample.name);
  return {
    id: 1,

    measureAmount: 2,

    measureUnit: handleShallow(shallow, fnSet, unitOfMeasureExample, false),

    packageType: handleShallow(
      shallow,
      fnSet,
      inventoryItemPackageExample,
      false,
    ),

    inventoryItem: handleSetHas(shallow, fnSet, inventoryItemExample, true),

    cost: '18.99',
  };
}
