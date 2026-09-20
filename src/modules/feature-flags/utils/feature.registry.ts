/**
 * The exhaustive set of product-area features the backend understands.
 * Deploy-time concept, not a database table — adding a feature is a code
 * change here (plus the route tags that use it), never a write.
 */
export const FEATURE_REGISTRY = {
    ORDER_MANAGEMENT: 'ORDER_MANAGEMENT',
    INVENTORY_MANAGEMENT: 'INVENTORY_MANAGEMENT',
    RECIPE_MANAGEMENT: 'RECIPE_MANAGEMENT',
    LABEL_PRINTING: 'LABEL_PRINTING',
} as const;

export type Feature = keyof typeof FEATURE_REGISTRY;

export function isRegisteredFeature(value: string): value is Feature {
    return Object.prototype.hasOwnProperty.call(FEATURE_REGISTRY, value);
}
