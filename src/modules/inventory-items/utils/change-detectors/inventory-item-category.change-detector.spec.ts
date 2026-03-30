import { InventoryItemCategory } from '../../entities/inventory-item-category.entity';
import { InventoryItemCategoryChangeDetector } from './inventory-item-category.change-detector';

describe('InventoryItemCategoryChangeDetector', () => {
    const detector = new InventoryItemCategoryChangeDetector();

    const baseEntity = (): InventoryItemCategory =>
        ({ id: 1, name: 'Dry' } as InventoryItemCategory);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseEntity();
        const dto = { name: entity.name };
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('detects name change', () => {
        const entity = baseEntity();
        const dto = { name: 'Frozen' };
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ name: 'Frozen' });
    });
});
