import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import {
    DerivationMenuItem,
    deriveVariationMapping,
} from './square-catalog-derivation';

const single: DerivationMenuItem = {
    id: 1,
    type: MENU_ITEM_TYPES.SINGLE,
    variableMaxAmount: null,
    sizeIds: [10, 11],
};

const unmapped = {
    menuItemId: null,
    menuItemSizeId: null,
    modifierMode: 'none',
};

describe('deriveVariationMapping', () => {
    it('maps the item and size when the size belongs to the item', () => {
        expect(deriveVariationMapping(single, 11)).toEqual({
            menuItemId: 1,
            menuItemSizeId: 11,
            modifierMode: 'none',
        });
    });

    it('leaves the link unmapped when the size is not one of the item sizes', () => {
        expect(deriveVariationMapping(single, 12)).toEqual(unmapped);
    });

    it('leaves the link unmapped without a hinted item or an aliased size', () => {
        expect(deriveVariationMapping(undefined, 10)).toEqual(unmapped);
        expect(deriveVariationMapping(single, null)).toEqual(unmapped);
    });

    it('defaults a variable container to container_contents', () => {
        const box = {
            ...single,
            type: MENU_ITEM_TYPES.CONTAINER,
            variableMaxAmount: 6,
        };
        expect(deriveVariationMapping(box, 10).modifierMode).toBe(
            'container_contents',
        );
    });

    it('keeps a fixed container at none', () => {
        const fixed = { ...single, type: MENU_ITEM_TYPES.CONTAINER };
        expect(deriveVariationMapping(fixed, 10).modifierMode).toBe('none');
    });
});
