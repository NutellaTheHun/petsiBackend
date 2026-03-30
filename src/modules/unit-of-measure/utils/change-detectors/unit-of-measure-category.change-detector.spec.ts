import { UnitOfMeasureCategory } from '../../entities/unit-of-measure-category.entity';
import { unitOfMeasureCategoryToUpdateDto } from '../entity-transformers/unit-of-measure-category.dto.transformer';
import { UnitOfMeasureCategoryChangeDetector } from './unit-of-measure-category.change-detector';

describe('UnitOfMeasureCategoryChangeDetector', () => {
    const detector = new UnitOfMeasureCategoryChangeDetector();

    const baseEntity = (): UnitOfMeasureCategory =>
        ({
            id: 1,
            name: 'Weight',
            baseConversionUnit: { id: 10 },
        } as UnitOfMeasureCategory);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseEntity();
        const dto = unitOfMeasureCategoryToUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('detects name and baseConversionUnitId changes', () => {
        const entity = baseEntity();
        const dto = unitOfMeasureCategoryToUpdateDto(entity, { name: 'Mass', baseConversionUnitId: 11 });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ name: 'Mass', baseConversionUnitId: 11 });
    });
});
