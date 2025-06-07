import { unitOfMeasureExample } from '../unit-of-measure/unit-of-measure.example';
import { inventoryItemPackageExample } from './inventory-item-package.example';
import { inventoryItemExample } from './inventory-item.example';

export function inventoryItemSizeExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(inventoryItemSizeExample.name);
  return {
    id: 1,
    measureAmount: 2,
    measureUnit: unitOfMeasureExample(fnSet),
    packageType: inventoryItemPackageExample(fnSet),
    inventoryItem:
      fnSet.has(inventoryItemExample.name) || shallow
        ? undefined
        : inventoryItemExample(fnSet, true),
    cost: '18.99',
  };
}
