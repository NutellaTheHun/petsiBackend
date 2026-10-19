export const FULFILLMENT_TYPES = {
    PICKUP: 'pickup',
    DELIVERY: 'delivery',
} as const;
export type FulfillmentType =
    (typeof FULFILLMENT_TYPES)[keyof typeof FULFILLMENT_TYPES];
