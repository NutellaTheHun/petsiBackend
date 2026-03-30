import { Label } from '../../entities/label.entity';
import { labelToUpdateDto } from '../entity-transformers/label.dto.transformer';
import { LabelChangeDetector } from './label.change-detector';

describe('LabelChangeDetector', () => {
    const detector = new LabelChangeDetector();

    const baseEntity = (): Label =>
        ({
            id: 1,
            imageUrl: 'https://example.com/a.png',
            menuItem: { id: 10 },
            labelType: { id: 20 },
        } as Label);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseEntity();
        const dto = labelToUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('detects imageUrl, menuItemId, and labelTypeId changes', () => {
        const entity = baseEntity();
        const dto = labelToUpdateDto(entity, {
            imageUrl: 'https://example.com/b.png',
            menuItemId: 11,
            labelTypeId: 22,
        });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({
            imageUrl: 'https://example.com/b.png',
            menuItemId: 11,
            labelTypeId: 22,
        });
    });
});
