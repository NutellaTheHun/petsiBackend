import { InventoryItemPackage } from '../../entities/inventory-item-package.entity';
import { InventoryItemSize } from '../../entities/inventory-item-size.entity';
import { UnitOfMeasure } from '../../../unit-of-measure/entities/unit-of-measure.entity';
import {
    inventoryItemSizeToNestedUpdateDto,
    inventoryItemSizeToUpdateDto,
} from '../entity-transformers/inventory-item-size.dto.transformer';
import { InventoryItemSizeChangeDetector } from './inventory-item-size.change-detector';

describe('InventoryItemSizeChangeDetector', () => {
    const detector = new InventoryItemSizeChangeDetector();

    const baseEntity = (): InventoryItemSize =>
        ({
            id: 1,
            package: { id: 10 } as InventoryItemPackage,
            measureType: { id: 20 } as UnitOfMeasure,
            measureAmount: 5,
            cost: '12.50',
        } as InventoryItemSize);

    it('returns empty patch for UpdateDto when dto matches entity', () => {
        const entity = baseEntity();
        const dto = inventoryItemSizeToUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('returns empty patch for NestedUpdateDto when dto matches entity', () => {
        const entity = baseEntity();
        const dto = inventoryItemSizeToNestedUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({ id: 1 });
    });

    it('detects nested field changes', () => {
        const entity = baseEntity();
        const dto = inventoryItemSizeToNestedUpdateDto(entity, {
            measureAmount: 9,
            cost: 20,
        });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ id: 1, measureAmount: 9, cost: 20 });
    });
});
