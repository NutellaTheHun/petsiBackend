export function tenantExample(fnSet: Set<string>, _shallow: boolean) {
    fnSet.add(tenantExample.name);
    return {
        id: 1,
        name: 'Petsi Pies',
        subdomain: 'petsi',
    };
}
