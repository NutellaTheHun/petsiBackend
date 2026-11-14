import {
    areModifierSiblings,
    ModifierLinkShape,
    modifierEnabledFromCategories,
    pickSiblingSource,
} from './square-modifier-siblings';

const link = (
    id: number,
    name: string,
    squareItemIds: string[],
    overrides: Partial<ModifierLinkShape> = {},
): ModifierLinkShape => ({
    id,
    squareModifierName: name,
    squareItemIds,
    kind: 'item',
    menuItemId: null,
    menuItemSizeId: null,
    mappingSource: 'derived',
    ...overrides,
});

describe('areModifierSiblings', () => {
    it('matches the same normalized name on a list sharing an item', () => {
        expect(
            areModifierSiblings(
                link(1, 'Chocolate Chip', ['box']),
                link(2, '  chocolate   CHIP ', ['box', 'other']),
            ),
        ).toBe(true);
    });

    it('never matches across items', () => {
        expect(
            areModifierSiblings(
                link(1, 'Chocolate Chip', ['cookie-box']),
                link(2, 'Chocolate Chip', ['muffin-box']),
            ),
        ).toBe(false);
    });

    it('never matches a different name or the link itself', () => {
        const a = link(1, 'Chocolate Chip', ['box']);
        expect(areModifierSiblings(a, link(2, 'Sugar', ['box']))).toBe(false);
        expect(areModifierSiblings(a, a)).toBe(false);
    });
});

describe('pickSiblingSource', () => {
    const target = link(1, 'Sugar', ['box']);

    it('prefers a manual sibling, then the lowest id', () => {
        const derived = link(2, 'Sugar', ['box'], { menuItemId: 10 });
        const manual = link(5, 'Sugar', ['box'], {
            menuItemId: 20,
            mappingSource: 'manual',
        });
        expect(pickSiblingSource(target, [manual, derived])).toBe(manual);
        expect(
            pickSiblingSource(target, [
                link(4, 'Sugar', ['box'], { menuItemId: 40 }),
                derived,
            ]),
        ).toBe(derived);
    });

    it('takes an ignored sibling as mapped', () => {
        const ignored = link(2, 'Sugar', ['box'], { kind: 'ignore' });
        expect(pickSiblingSource(target, [ignored])).toBe(ignored);
    });

    it('returns undefined when no sibling is mapped', () => {
        expect(
            pickSiblingSource(target, [
                link(2, 'Sugar', ['box']),
                link(3, 'Sugar', ['elsewhere'], { menuItemId: 10 }),
            ]),
        ).toBeUndefined();
    });
});

describe('modifierEnabledFromCategories', () => {
    const categoryIdByItem = new Map<string, string | null>([
        ['drink', 'drinks'],
        ['latte', 'drinks'],
        ['pie', 'pies'],
        ['loose', null],
    ]);
    const categoryEnabled = new Map([
        ['drinks', false],
        ['pies', true],
    ]);
    const enabled = (itemIds: string[]) =>
        modifierEnabledFromCategories(
            itemIds,
            categoryIdByItem,
            categoryEnabled,
        );

    it('is disabled only when every attached item is in a disabled category', () => {
        expect(enabled(['drink', 'latte'])).toBe(false);
        expect(enabled(['drink', 'pie'])).toBe(true);
    });

    it('is enabled when unattached, uncategorized or of an unknown item', () => {
        expect(enabled([])).toBe(true);
        expect(enabled(['loose'])).toBe(true);
        expect(enabled(['unknown'])).toBe(true);
    });
});
