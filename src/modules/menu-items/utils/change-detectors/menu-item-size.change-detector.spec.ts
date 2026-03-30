import { MenuItemSize } from '../../entities/menu-item-size.entity';
import { menuItemSizeToUpdateDto } from '../entity-transformers/menu-item-size.dto.transfomer';
import { MenuItemSizeChangeDetector } from './menu-item-size.change-detector';

describe('MenuItemSizeChangeDetector', () => {
    const detector = new MenuItemSizeChangeDetector();

    const baseEntity = (): MenuItemSize => ({ id: 1, name: 'Large' } as MenuItemSize);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseEntity();
        const dto = menuItemSizeToUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('detects name change', () => {
        const entity = baseEntity();
        const dto = menuItemSizeToUpdateDto(entity, { name: 'XL' });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ name: 'XL' });
    });
});
