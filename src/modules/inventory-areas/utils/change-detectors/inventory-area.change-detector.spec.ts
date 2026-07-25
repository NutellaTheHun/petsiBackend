import { InventoryArea } from '../../entities/inventory-area.entity';
import { InventoryAreaChangeDetector } from './inventory-area.change-detector';

describe('InventoryAreaChangeDetector', () => {
    const detector = new InventoryAreaChangeDetector();

    const baseEntity = (): InventoryArea => ({ id: 1, name: 'Pantry', locationId: 1 } as InventoryArea);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseEntity();
        const dto = { name: entity.name, locationId: entity.locationId };
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('detects name change', () => {
        const entity = baseEntity();
        const dto = { name: 'Cold storage', locationId: entity.locationId };
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ name: 'Cold storage' });
    });

    it('detects locationId change', () => {
        const entity = baseEntity();
        const dto = { name: entity.name, locationId: 2 };
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ locationId: 2 });
    });
});
