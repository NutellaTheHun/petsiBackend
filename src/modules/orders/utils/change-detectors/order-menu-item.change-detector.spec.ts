import { MenuItem } from '../../../menu-items/entities/menu-item.entity';
import { MenuItemSize } from '../../../menu-items/entities/menu-item-size.entity';
import { OrderContainerItem } from '../../entities/order-container-item.entity';
import { OrderMenuItem } from '../../entities/order-menu-item.entity';
import { orderMenuItemToNestedUpdateDto } from '../entity-transformers/order-menu-item.dto.transformer';
import { OrderContainerItemChangeDetector } from './order-container-item.change-detector';
import { OrderMenuItemChangeDetector } from './order-menu-item.change-detector';

describe('OrderMenuItemChangeDetector', () => {
    const detector = new OrderMenuItemChangeDetector(new OrderContainerItemChangeDetector());

    const containerRow = (): OrderContainerItem =>
        ({
            id: 50,
            containedMenuItem: { id: 8 } as MenuItem,
            containedItemSize: { id: 9 } as MenuItemSize,
            quantity: 1,
        } as OrderContainerItem);

    const baseEntity = (): OrderMenuItem =>
        ({
            id: 100,
            menuItem: { id: 1 } as MenuItem,
            size: { id: 2 } as MenuItemSize,
            quantity: 3,
            containerOrderMenuItems: [containerRow()],
        } as OrderMenuItem);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseEntity();
        const dto = orderMenuItemToNestedUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({ id: 100 });
    });

    it('detects root field changes without nested changes', () => {
        const entity = baseEntity();
        const dto = orderMenuItemToNestedUpdateDto(entity, { quantity: 10, menuItemId: 99 });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toMatchObject({ id: 100, quantity: 10, menuItemId: 99 });
        expect(result.patch.containerOrderMenuItems).toBeUndefined();
    });

    it('includes create container rows in patch', () => {
        const entity = { ...baseEntity(), containerOrderMenuItems: [] };
        const createRow = {
            createId: 'c1',
            containedMenuItemId: 8,
            containedItemSizeId: 9,
            quantity: 2,
            parentMenuItemIdCtx: 1,
            parentMenuItemSizeIdCtx: 2,
        };
        const dto = orderMenuItemToNestedUpdateDto(entity, { containerOrderMenuItems: [createRow] });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch.containerOrderMenuItems).toEqual([createRow]);
    });

    it('patches only changed container child', () => {
        const entity = baseEntity();
        const dto = orderMenuItemToNestedUpdateDto(entity, {
            containerOrderMenuItems: [
                { id: 50, containedMenuItemId: 8, containedItemSizeId: 9, quantity: 7 },
            ],
        });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch.containerOrderMenuItems).toEqual([{ id: 50, quantity: 7 }]);
    });
});
