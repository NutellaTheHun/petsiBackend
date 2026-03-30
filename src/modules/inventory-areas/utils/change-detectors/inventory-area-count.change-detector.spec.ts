import { InventoryArea } from '../../entities/inventory-area.entity';
import { InventoryAreaCount } from '../../entities/inventory-area-count.entity';
import { InventoryAreaItem } from '../../entities/inventory-area-item.entity';
import { InventoryItem } from '../../../inventory-items/entities/inventory-item.entity';
import { InventoryItemSize } from '../../../inventory-items/entities/inventory-item-size.entity';
import { inventoryAreaCountToUpdateDto } from '../entity-transformers/inventory-area-count.dto.transformer';
import { InventoryAreaItemChangeDetector } from './inventory-area-item.change-detector';
import { InventoryAreaCountChangeDetector } from './inventory-area-count.change-detector';

describe('InventoryAreaCountChangeDetector', () => {
    const detector = new InventoryAreaCountChangeDetector(new InventoryAreaItemChangeDetector());

    const areaItem = (id: number): InventoryAreaItem =>
        ({
            id,
            countedInventoryItem: { id: 100 } as InventoryItem,
            amount: 2,
            countedItemSize: { id: 200 } as InventoryItemSize,
        } as InventoryAreaItem);

    const baseEntity = (): InventoryAreaCount =>
        ({
            id: 1,
            inventoryArea: { id: 50 } as InventoryArea,
            countedInventoryItems: [areaItem(10)],
        } as InventoryAreaCount);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseEntity();
        const dto = inventoryAreaCountToUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('detects inventoryAreaId change', () => {
        const entity = baseEntity();
        const dto = inventoryAreaCountToUpdateDto(entity, { inventoryAreaId: 51 });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toMatchObject({ inventoryAreaId: 51 });
    });

    it('includes create rows for counted items', () => {
        const entity = baseEntity();
        const createRow = {
            createId: 'c1',
            countedInventoryItemId: 300,
            amount: 1,
            countedItemSizeId: 400,
        };
        const dto = inventoryAreaCountToUpdateDto(entity, { countedInventoryItems: [createRow] });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch.countedInventoryItems).toEqual([createRow]);
    });

    it('patches only changed counted child', () => {
        const entity = baseEntity();
        const dto = inventoryAreaCountToUpdateDto(entity, {
            countedInventoryItems: [
                { id: 10, countedInventoryItemId: 100, amount: 99, countedItemSizeId: 200 },
            ],
        });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch.countedInventoryItems).toEqual([{ id: 10, amount: 99 }]);
    });
});
