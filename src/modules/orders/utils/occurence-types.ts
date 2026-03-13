export const OCCURENCE_TYPES = {
    TEMPLATE: 'TEMPLATE',
    OCCURENCE: 'OCCURENCE',
} as const;
export type OccurenceType = (typeof OCCURENCE_TYPES)[keyof typeof OCCURENCE_TYPES];

export const OCCURENCE_STATES = {
    GENERATED: 'GENERATED',
    MODIFIED: 'MODIFIED',
    CANCELLED: 'CANCELLED',
} as const;
export type OccurenceState = (typeof OCCURENCE_STATES)[keyof typeof OCCURENCE_STATES];