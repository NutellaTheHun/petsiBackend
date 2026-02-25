export const VOLUME = "volume";
export const WEIGHT = "weight";
export const UNIT = "unit";

export function getUnitOfMeasureCategoryNames(): string[] {
    return [VOLUME, WEIGHT, UNIT];
}

export const EACH = "each";
export const KILOGRAM = "kilogram";
export const GRAM = "gram";
export const POUND = "pound";
export const OUNCE = "ounce";
export const TABLESPOON = "tablespoon";
export const TEASPOON = "teaspoon";
export const CUP = "cup";
export const MILLILITER = "milliliter";
export const LITER = "liter";
export const GALLON = "gallon";
export const FL_OUNCE = "fluid ounce";
export const QUART = "quart";
export const PINT = "pint";

export function getUnitOfMeasureNames(): string[] {
    return [EACH, KILOGRAM, GRAM, POUND, OUNCE, TABLESPOON, TEASPOON, CUP, MILLILITER, LITER, GALLON, FL_OUNCE, QUART, PINT];
}

export const PINT_ABBREV = "pt";
export const QUART_ABBREV = "qt";
export const FL_OUNCE_ABBREV = "fl. oz";
export const GALLON_ABBREV = "gal";
export const LITER_ABBREV = "L";
export const MILLILITER_ABBREV = "mL";
export const CUP_ABBREV = "c";
export const TEASPOON_ABBREV = "tsp";
export const TABLESPOON_ABBREV = "tbsp";
export const OUNCE_ABBREV = "oz";
export const POUND_ABBREV = "lbs";
export const GRAM_ABBREV = "g";
export const KILOGRAM_ABBREV = "kg";
export const EACH_ABBREV = "ea";

export function getUnitOfMeasureAbbreviations(): string[] {
    return [EACH_ABBREV, KILOGRAM_ABBREV, GRAM_ABBREV, POUND_ABBREV, OUNCE_ABBREV, TABLESPOON_ABBREV, TEASPOON_ABBREV, CUP_ABBREV, MILLILITER_ABBREV, LITER_ABBREV, GALLON_ABBREV, FL_OUNCE_ABBREV, QUART_ABBREV, PINT_ABBREV];
}