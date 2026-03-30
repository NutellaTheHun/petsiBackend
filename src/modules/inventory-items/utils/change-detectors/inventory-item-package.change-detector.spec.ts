import { InventoryItemPackage } from '../../entities/inventory-item-package.entity';
import { InventoryItemPackageChangeDetector } from './inventory-item-package.change-detector';

describe('InventoryItemPackageChangeDetector', () => {
    const detector = new InventoryItemPackageChangeDetector();

    const baseEntity = (): InventoryItemPackage => ({ id: 1, name: 'Case' } as InventoryItemPackage);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseEntity();
        const dto = { name: entity.name };
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('detects name change', () => {
        const entity = baseEntity();
        const dto = { name: 'Box' };
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ name: 'Box' });
    });
});
