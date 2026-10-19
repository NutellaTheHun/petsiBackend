export function inventoryItemPackageExample(
    fnSet: Set<string>,
    _shallow: boolean,
) {
    fnSet.add(inventoryItemPackageExample.name);
    return {
        id: 1,
        name: 'box',
    };
}
