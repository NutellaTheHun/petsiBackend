export function inventoryItemPackageExample(
  fnSet: Set<string>,
  shallow: boolean,
) {
  fnSet.add(inventoryItemPackageExample.name);
  return {
    id: 1,
    packageName: 'box',
  };
}
