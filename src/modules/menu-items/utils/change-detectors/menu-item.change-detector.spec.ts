import { MENU_ITEM_TYPES } from '../../utils/menu-item-type';
import { MenuItem } from '../../entities/menu-item.entity';
import { MenuItemContainerItem } from '../../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../../entities/menu-item-size.entity';
import { MenuItemCategory } from '../../entities/menu-item-category.entity';
import { menuItemToUpdateDto } from '../entity-transformers/menu-item.dto.transfomer';
import { MenuItemContainerItemChangeDetector } from './menu-item-container-item.change-detector';
import { MenuItemChangeDetector } from './menu-item.change-detector';

describe('MenuItemChangeDetector', () => {
    const detector = new MenuItemChangeDetector(new MenuItemContainerItemChangeDetector());

    const containerChild = (): MenuItemContainerItem =>
        ({
            id: 100,
            containedMenuItem: { id: 1, name: 'x' } as MenuItem,
            containedItemSize: { id: 2 } as MenuItemSize,
            quantity: 3,
        } as MenuItemContainerItem);

    const baseEntity = (): MenuItem =>
        ({
            id: 1,
            name: 'Combo',
            type: MENU_ITEM_TYPES.CONTAINER,
            category: { id: 5 } as MenuItemCategory,
            sizes: [{ id: 10 }, { id: 11 }] as MenuItemSize[],
            variableMaxAmount: null,
            containerMenuItems: [containerChild()],
            dynamicPropertyValues: [],
            dynamicProperties: [],
            computeDynamicProperties: () => {},
        } as unknown as MenuItem);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseEntity();
        const dto = menuItemToUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('does not run container diff when containerMenuItems is undefined', () => {
        const entity = baseEntity();
        const full = menuItemToUpdateDto(entity);
        const dto = { ...full, containerMenuItems: undefined };
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch.containerMenuItems).toBeUndefined();
    });

    it('detects root field changes without nested changes', () => {
        const entity = baseEntity();
        const dto = menuItemToUpdateDto(entity, { name: 'New', type: MENU_ITEM_TYPES.SINGLE });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toMatchObject({ name: 'New', type: MENU_ITEM_TYPES.SINGLE });
        expect(result.patch.containerMenuItems).toBeUndefined();
    });

    it('detects sizeIds change', () => {
        const entity = baseEntity();
        const dto = menuItemToUpdateDto(entity, { sizeIds: [11, 10, 12] });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch.sizeIds).toEqual([11, 10, 12]);
    });

    it('includes create container rows in nested patch', () => {
        const entity = { ...baseEntity(), containerMenuItems: [], computeDynamicProperties: () => {} } as unknown as MenuItem;
        const createRow = {
            createId: 'c1',
            containedMenuItemId: 9,
            containedItemSizeId: 8,
            quantity: 1,
            parentItemSizeId: 10,
        };
        const dto = menuItemToUpdateDto(entity, { containerMenuItems: [createRow] });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch.containerMenuItems).toEqual([createRow]);
    });

    it('patches full containerMenuItems when a row changes (authoritative)', () => {
        const entity = baseEntity();
        const rows = [
            {
                id: 100,
                containedMenuItemId: 1,
                containedItemSizeId: 2,
                quantity: 99,
            },
        ];
        const dto = menuItemToUpdateDto(entity, {
            containerMenuItems: rows,
        });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch.containerMenuItems).toEqual(dto.containerMenuItems);
    });
});
