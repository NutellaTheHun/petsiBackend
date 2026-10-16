export function handleShallow(
    shallow: boolean,
    fnSet: Set<string>,
    fn: (fnSet: Set<string>, nextShallow: boolean) => object,
    isParent: boolean,
): object {
    if (isParent) {
        return {};
    } else {
        return fn(fnSet, true);
    }
}

export function handleSetHas(
    shallow: boolean,
    fnSet: Set<string>,
    fn: (fnSet: Set<string>, nextShallow: boolean) => object,
    isParent: boolean,
): object {
    if (isParent) {
        return {};
    }
    if (shallow || fnSet.has(fn.name)) {
        return {};
    } else {
        return fn(fnSet, true);
    }
}
