import { InventoryAreaItem } from '../../entities/inventory-area-item.entity';
import { InventoryItem } from '../../../inventory-items/entities/inventory-item.entity';
import { InventoryItemSize } from '../../../inventory-items/entities/inventory-item-size.entity';
import {
    inventoryAreaItemToNestedUpdateDto,
    inventoryAreaItemToUpdateDto,
} from '../entity-transformers/inventory-area-item.dto.transformer';
import { InventoryAreaItemChangeDetector } from './inventory-area-item.change-detector';

describe('InventoryAreaItemChangeDetector', () => {
    const detector = new InventoryAreaItemChangeDetector();

    const baseEntity = (): InventoryAreaItem =>
        ({
            id: 1,
            countedInventoryItem: { id: 10 } as InventoryItem,
            amount: 4,
            countedItemSize: { id: 20 } as InventoryItemSize,
        } as InventoryAreaItem);

    it('returns empty patch for UpdateDto when dto matches entity', () => {
        const entity = baseEntity();
        const dto = inventoryAreaItemToUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('returns empty patch for NestedUpdateDto when dto matches entity', () => {
        const entity = baseEntity();
        const dto = inventoryAreaItemToNestedUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({ id: 1 });
    });

    it('detects amount and countedItemSizeId changes', () => {
        const entity = baseEntity();
        const dto = inventoryAreaItemToNestedUpdateDto(entity, { amount: 8, countedInventoryItemId: 99 });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ id: 1, amount: 8, countedInventoryItemId: 99 });
    });
});
