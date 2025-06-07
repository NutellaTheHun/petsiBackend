import { menuItemExample } from '../menu-items/menu-item.example';

export function inventoryItemVendorExample(fnSet: Set<string>) {
  fnSet.add(inventoryItemVendorExample.name);
  return {
    id: 1,
    vendorName: 'shaws',
    vendorItems: fnSet.has(menuItemExample.name)
      ? undefined
      : [menuItemExample(fnSet)],
  };
}
