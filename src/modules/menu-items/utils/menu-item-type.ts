export const MENU_ITEM_TYPES = {
  SINGLE: 'single',
  FIXED_CONTAINER: 'fixed_container',
  VARIABLE_CONTAINER: 'variable_container',
};

export type MenuItemType =
  (typeof MENU_ITEM_TYPES)[keyof typeof MENU_ITEM_TYPES];
