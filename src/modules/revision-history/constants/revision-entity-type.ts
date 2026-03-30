export const REVISION_ENTITY_TYPES = {
    ORDER: 'order',
    MENU_ITEM: 'menu_item',
} as const;

export type RevisionEntityType =
    (typeof REVISION_ENTITY_TYPES)[keyof typeof REVISION_ENTITY_TYPES];
