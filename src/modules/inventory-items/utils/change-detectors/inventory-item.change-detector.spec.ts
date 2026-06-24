import { InventoryItemCategory } from '../../entities/inventory-item-category.entity';
import { InventoryItemPackage } from '../../entities/inventory-item-package.entity';
import { InventoryItemSize } from '../../entities/inventory-item-size.entity';
import { InventoryItemVendor } from '../../entities/inventory-item-vendor.entity';
import { InventoryItem } from '../../entities/inventory-item.entity';
import { AppUnit } from '../../../../common/units';
import { inventoryItemToUpdateDto } from '../entity-transformers/inventory-item.dto.transformer';
import { InventoryItemSizeChangeDetector } from './inventory-item-size.change-detector';
import { InventoryItemChangeDetector } from './inventory-item.change-detector';

describe('InventoryItemChangeDetector', () => {
    const detector = new InventoryItemChangeDetector(new InventoryItemSizeChangeDetector());

    const sizeEntity = (id: number): InventoryItemSize =>
        ({
            id,
            package: { id: 100 } as InventoryItemPackage,
            unit: 'lb' as AppUnit,
            measureAmount: 1,
            cost: '5.00',
        } as InventoryItemSize);

    const baseEntity = (): InventoryItem =>
        ({
            id: 1,
            name: 'Sugar',
            category: { id: 10 } as InventoryItemCategory,
            vendor: { id: 20 } as InventoryItemVendor,
            sizes: [sizeEntity(30)],
        } as InventoryItem);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseEntity();
        const dto = inventoryItemToUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('detects root field changes without nested changes', () => {
        const entity = baseEntity();
        const dto = inventoryItemToUpdateDto(entity, { name: 'Salt', categoryId: 11, vendorId: 21 });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toMatchObject({ name: 'Salt', categoryId: 11, vendorId: 21 });
        expect(result.patch.sizes).toBeUndefined();
    });

    it('includes new size create rows in patch', () => {
        const entity = baseEntity();
        const createSize = {
            createId: 'n1',
            packageId: 100,
            unit: 'lb' as AppUnit,
            measureAmount: 2,
            cost: 3,
        };
        const dto = inventoryItemToUpdateDto(entity, { sizes: [createSize] });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch.sizes).toEqual([createSize]);
    });

    it('patches only changed size child', () => {
        const entity = baseEntity();
        const dto = inventoryItemToUpdateDto(entity, {
            sizes: [{ id: 30, packageId: 100, unit: 'lb' as AppUnit, measureAmount: 1, cost: 9 }],
        });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch.sizes).toEqual([{ id: 30, cost: 9 }]);
    });
});
