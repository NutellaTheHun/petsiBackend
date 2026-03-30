import { UnitOfMeasure } from '../../entities/unit-of-measure.entity';
import { unitOfMeasureToUpdateDto } from '../entity-transformers/unit-of-measure.dto.transformer';
import { UnitOfMeasureChangeDetector } from './unit-of-measure.change-detector';

describe('UnitOfMeasureChangeDetector', () => {
    const detector = new UnitOfMeasureChangeDetector();

    const baseEntity = (): UnitOfMeasure =>
        ({
            id: 1,
            name: 'Kilogram',
            abbreviation: 'kg',
            conversionFactorToBase: '1000',
            category: { id: 5 },
        } as UnitOfMeasure);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseEntity();
        const dto = unitOfMeasureToUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('detects scalar field changes', () => {
        const entity = baseEntity();
        const dto = unitOfMeasureToUpdateDto(entity, { abbreviation: 'KG', conversionFactorToBase: '2' });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({
            abbreviation: 'KG',
            conversionFactorToBase: '2',
        });
    });

    it('detects categoryId change', () => {
        const entity = baseEntity();
        const dto = unitOfMeasureToUpdateDto(entity, { categoryId: 99 });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ categoryId: 99 });
    });
});
