import { MenuItem } from '../../entities/menu-item.entity';
import { MenuItemContainerItem } from '../../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../../entities/menu-item-size.entity';
import {
    menuItemContainerItemToNestedUpdateDto,
    menuItemContainerItemToUpdateDto,
} from '../entity-transformers/menu-item-container-item.dto.transfomer';
import { MenuItemContainerItemChangeDetector } from './menu-item-container-item.change-detector';

describe('MenuItemContainerItemChangeDetector', () => {
    const detector = new MenuItemContainerItemChangeDetector();

    const baseEntity = (): MenuItemContainerItem =>
        ({
            id: 1,
            containedMenuItem: { id: 10 } as MenuItem,
            containedItemSize: { id: 20 } as MenuItemSize,
            quantity: 2,
        } as MenuItemContainerItem);

    it('returns empty patch for UpdateDto when dto matches entity', () => {
        const entity = baseEntity();
        const dto = menuItemContainerItemToUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('returns empty patch for NestedUpdateDto when dto matches entity', () => {
        const entity = baseEntity();
        const dto = menuItemContainerItemToNestedUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({ id: 1 });
    });

    it('detects nested update changes', () => {
        const entity = baseEntity();
        const dto = menuItemContainerItemToNestedUpdateDto(entity, { quantity: 5, containedMenuItemId: 11 });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ id: 1, quantity: 5, containedMenuItemId: 11 });
    });
});
