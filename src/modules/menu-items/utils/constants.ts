export const CAT_RED = "category red";
export const CAT_BLUE = "category blue";
export const CAT_GREEN = "category green";
export const CAT_ORANGE = "category orange";

export function getTestCategoryNames(): string[] {
    return [CAT_RED, CAT_BLUE, CAT_GREEN, CAT_ORANGE];
}

export const SIZE_ONE = "size 1";
export const SIZE_TWO = "size 2";
export const SIZE_THREE = "size 3";
export const SIZE_FOUR = "size 4";

export function getTestSizeNames(): string[] {
    return [SIZE_ONE, SIZE_TWO, SIZE_THREE, SIZE_FOUR];
}

export const item_a = "item a"
export const item_b = "item b"
export const item_c = "item c"
export const item_d = "item d"
export const item_e = "item e"
export const item_f = "item f"
export const item_g = "item g"

export const container_a = "container a";
export const container_b = "container b";
export const container_c = "container c";

export function getTestItemNames(): string[] {
    return [item_a, item_b, item_c, item_d, item_e, item_f, item_g];
}

export const item_container_a = "container a";
export const item_container_b = "container b";
export const item_var_max_container_c = "container c";
export const item_var_max_container_d = "container d";

export function getNonVarMaxItemContainerTestNames(): string[] {
    return [container_a, container_b];
}

export function getVarMaxItemContainerTestNames(): string[] {
    return [item_var_max_container_c, item_var_max_container_d];
}