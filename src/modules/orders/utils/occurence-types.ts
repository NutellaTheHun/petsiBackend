export const OCCURRENCE_TYPES = {
    TEMPLATE: 'TEMPLATE',
    OCCURRENCE: 'OCCURRENCE',
} as const;
export type OccurrenceType = (typeof OCCURRENCE_TYPES)[keyof typeof OCCURRENCE_TYPES];

export const OCCURRENCE_STATES = {
    GENERATED: 'GENERATED',
    MODIFIED: 'MODIFIED',
    CANCELLED: 'CANCELLED',
} as const;
export type OccurrenceState = (typeof OCCURRENCE_STATES)[keyof typeof OCCURRENCE_STATES];