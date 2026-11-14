import { SquareModifierKind } from '../entities/square-modifier-link.entity';
import { SquareMappingSource } from '../entities/square-variation-link.entity';
import { normalizeSquareName } from './square-name';

/** The modifier-link fields sibling and category rules read. */
export interface ModifierLinkShape {
    id: number;
    squareModifierName: string;
    squareItemIds: string[];
    kind: SquareModifierKind;
    menuItemId: number | null;
    menuItemSizeId: number | null;
    mappingSource: SquareMappingSource;
}

/** The choice propagation copies from one modifier link to its siblings. */
export type ModifierMapping = Pick<
    ModifierLinkShape,
    'kind' | 'menuItemId' | 'menuItemSizeId'
>;

/** Mapped to a menu item, or ignored: either way it no longer blocks a line. */
export function isModifierMapped(link: ModifierMapping): boolean {
    return link.kind === 'ignore' || link.menuItemId != null;
}

/**
 * Same normalized name, on a list attached to at least one of the same
 * Square items. Never across items: a same-named modifier on a list that
 * shares no item is not a sibling.
 */
export function areModifierSiblings(
    a: ModifierLinkShape,
    b: ModifierLinkShape,
): boolean {
    return (
        a.id !== b.id &&
        normalizeSquareName(a.squareModifierName) ===
            normalizeSquareName(b.squareModifierName) &&
        a.squareItemIds.some((itemId) => b.squareItemIds.includes(itemId))
    );
}

/**
 * The mapped sibling an unmapped link copies on sync: a `manual` one first,
 * then the lowest id, so the choice is stable. Undefined when none is mapped.
 */
export function pickSiblingSource<T extends ModifierLinkShape>(
    link: ModifierLinkShape,
    candidates: T[],
): T | undefined {
    return candidates
        .filter((c) => isModifierMapped(c) && areModifierSiblings(link, c))
        .sort(
            (a, b) =>
                Number(b.mappingSource === 'manual') -
                    Number(a.mappingSource === 'manual') || a.id - b.id,
        )[0];
}

/**
 * A modifier link's category-driven `enabled`: modifier lists have no
 * category, so it follows the items the list is attached to. Disabled only
 * when every attached item is in a disabled category; `true` when it's
 * attached to nothing or to an uncategorized item.
 */
export function modifierEnabledFromCategories(
    squareItemIds: string[],
    categoryIdByItem: Map<string, string | null>,
    categoryEnabled: Map<string, boolean>,
): boolean {
    if (squareItemIds.length === 0) {
        return true;
    }
    return squareItemIds.some((itemId) => {
        const categoryId = categoryIdByItem.get(itemId);
        return categoryId == null || (categoryEnabled.get(categoryId) ?? true);
    });
}
