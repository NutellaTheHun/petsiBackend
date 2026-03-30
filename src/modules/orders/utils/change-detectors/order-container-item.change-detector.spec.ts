import { MenuItem } from '../../../menu-items/entities/menu-item.entity';
import { MenuItemSize } from '../../../menu-items/entities/menu-item-size.entity';
import { OrderContainerItem } from '../../entities/order-container-item.entity';
import { orderContainerItemToNestedUpdateDto } from '../entity-transformers/order-container-item.dto.transformer';
import { OrderContainerItemChangeDetector } from './order-container-item.change-detector';

describe('OrderContainerItemChangeDetector', () => {
    const detector = new OrderContainerItemChangeDetector();

    const baseEntity = (): OrderContainerItem =>
        ({
            id: 1,
            containedMenuItem: { id: 10 } as MenuItem,
            containedItemSize: { id: 20 } as MenuItemSize,
            quantity: 2,
        } as OrderContainerItem);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseEntity();
        const dto = orderContainerItemToNestedUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({ id: 1 });
    });

    it('detects field changes', () => {
        const entity = baseEntity();
        const dto = orderContainerItemToNestedUpdateDto(entity, {
            quantity: 5,
            containedMenuItemId: 11,
        });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({
            id: 1,
            quantity: 5,
            containedMenuItemId: 11,
        });
    });
});
