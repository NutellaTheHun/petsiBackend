import { LabelType } from '../../entities/label-type.entity';
import { labelTypeToUpdateDto } from '../entity-transformers/label-type.dto.transformer';
import { LabelTypeChangeDetector } from './label-type.change-detector';

describe('LabelTypeChangeDetector', () => {
    const detector = new LabelTypeChangeDetector();

    const baseEntity = (): LabelType =>
        ({
            id: 1,
            name: 'Standard',
            length: 4,
            width: 6,
        } as LabelType);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseEntity();
        const dto = labelTypeToUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('detects dimension changes', () => {
        const entity = baseEntity();
        const dto = labelTypeToUpdateDto(entity, { length: 5, width: 7 });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ length: 5, width: 7 });
    });
});
