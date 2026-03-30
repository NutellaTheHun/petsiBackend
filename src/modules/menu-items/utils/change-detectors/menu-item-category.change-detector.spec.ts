import { MenuItemCategory } from '../../entities/menu-item-category.entity';
import { menuItemCategoryToUpdateDto } from '../entity-transformers/menu-item-category.dto.transfomer';
import { MenuItemCategoryChangeDetector } from './menu-item-category.change-detector';

describe('MenuItemCategoryChangeDetector', () => {
    const detector = new MenuItemCategoryChangeDetector();

    const baseEntity = (): MenuItemCategory => ({ id: 1, name: 'Drinks' } as MenuItemCategory);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseEntity();
        const dto = menuItemCategoryToUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('detects name change', () => {
        const entity = baseEntity();
        const dto = menuItemCategoryToUpdateDto(entity, { name: 'Beverages' });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ name: 'Beverages' });
    });
});
