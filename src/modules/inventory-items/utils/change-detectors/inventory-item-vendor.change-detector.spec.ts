import { InventoryItemVendor } from '../../entities/inventory-item-vendor.entity';
import { InventoryItemVendorChangeDetector } from './inventory-item-vendor.change-detector';

describe('InventoryItemVendorChangeDetector', () => {
    const detector = new InventoryItemVendorChangeDetector();

    const baseEntity = (): InventoryItemVendor => ({ id: 1, name: 'Acme' } as InventoryItemVendor);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseEntity();
        const dto = { name: entity.name };
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('detects name change', () => {
        const entity = baseEntity();
        const dto = { name: 'NewVendor' };
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ name: 'NewVendor' });
    });
});
