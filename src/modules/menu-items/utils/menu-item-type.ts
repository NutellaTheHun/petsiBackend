export const MENU_ITEM_TYPES = {
  SINGLE: 'single',
  CONTAINER: 'container',
};

export type MenuItemType =
  (typeof MENU_ITEM_TYPES)[keyof typeof MENU_ITEM_TYPES];
