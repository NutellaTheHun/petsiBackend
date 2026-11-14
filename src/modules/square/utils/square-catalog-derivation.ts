import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { SquareModifierMode } from '../entities/square-variation-link.entity';

/** What derivation needs to know about a menu item. */
export interface DerivationMenuItem {
    id: number;
    type: string;
    variableMaxAmount: number | null;
    sizeIds: number[];
}

export interface DerivedVariationMapping {
    menuItemId: number | null;
    menuItemSizeId: number | null;
    modifierMode: SquareModifierMode;
}

/**
 * The mapping a `derived` variation link takes from its item hint's menu item
 * and its size alias's size. Applied only when both are set and the size is
 * one of the menu item's sizes; otherwise the link is unmapped. A variable
 * container takes its contents from modifiers (`container_contents`).
 */
export function deriveVariationMapping(
    menuItem: DerivationMenuItem | undefined,
    menuItemSizeId: number | null,
): DerivedVariationMapping {
    if (
        !menuItem ||
        menuItemSizeId == null ||
        !menuItem.sizeIds.includes(menuItemSizeId)
    ) {
        return { menuItemId: null, menuItemSizeId: null, modifierMode: 'none' };
    }
    const isVariableContainer =
        menuItem.type === MENU_ITEM_TYPES.CONTAINER &&
        menuItem.variableMaxAmount != null;
    return {
        menuItemId: menuItem.id,
        menuItemSizeId,
        modifierMode: isVariableContainer ? 'container_contents' : 'none',
    };
}
