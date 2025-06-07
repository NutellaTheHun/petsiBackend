export function inventoryItemPackageExample(fnSet: Set<string>) {
  fnSet.add(inventoryItemPackageExample.name);
  return {
    id: 1,
    packageName: 'box',
  };
}
