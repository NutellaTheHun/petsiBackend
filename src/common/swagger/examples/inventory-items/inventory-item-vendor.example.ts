import { handleSetHas } from '../handlers/handlers';
import { menuItemExample } from '../menu-items/menu-item.example';

export function inventoryItemVendorExample(
  fnSet: Set<string>,
  shallow: boolean,
) {
  fnSet.add(inventoryItemVendorExample.name);
  return {
    id: 1,

    vendorName: 'shaws',

    vendorItems: [handleSetHas(shallow, fnSet, menuItemExample, false)],
  };
}
