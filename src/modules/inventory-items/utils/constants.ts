export const FOOD_A = "foodA";
export const DRY_A = "dryA";
export const OTHER_A = "otherA";
export const FOOD_B = "foodB";
export const DRY_B = "dryB";
export const OTHER_B = "otherB";
export const FOOD_C = "foodC";
export const DRY_C = "dryC";
export const OTHER_C = "otherC";

export function getInventoryItemNames(): string[] {
    return [FOOD_A, DRY_A, OTHER_A, FOOD_B, DRY_B, OTHER_B, FOOD_C, DRY_C, OTHER_C];
}

export function getInventoryFoodItemNames(): string[] {
    return [FOOD_A, FOOD_B, FOOD_C];
}

export function getInventoryDryItemNames(): string[] {
    return [DRY_A, DRY_B, DRY_C];
}

export function getInventoryOtherItemNames(): string[] {
    return [OTHER_A, OTHER_B, OTHER_C];
}

export const VENDOR_A = "vendorA";
export const VENDOR_B = "vendorB";
export const VENDOR_C = "vendorC";

export function getInventoryVendorNames(): string[] {
    return [VENDOR_A, VENDOR_B, VENDOR_C];
}

export const BAG_PKG = "bag";
export const PACKAGE_PKG = "package";
export const BOX_PKG = "box";
export const OTHER_PKG = "other";
export const CONTAINER_PKG = "container";
export const CAN_PKG = "can";


export function getInventoryPackageNames(): string[] {
    return [BAG_PKG, PACKAGE_PKG, BOX_PKG, OTHER_PKG, CONTAINER_PKG, CAN_PKG];
}
export const CLEANING_CAT = "cleaning";
export const DAIRY_CAT = "dairy"
export const DRYGOOD_CAT = "dry goods";
export const FOOD_CAT = "food";
export const FROZEN_CAT = "frozen";
export const OTHER_CAT = "other";
export const PAPER_CAT = "paper goods";
export const PRODUCE_CAT = "produce";