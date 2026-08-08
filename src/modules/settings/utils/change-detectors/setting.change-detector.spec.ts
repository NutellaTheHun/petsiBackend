import { Setting, SettingValueType } from '../../entities/setting.entity';
import { SettingChangeDetector } from './setting.change-detector';

describe('SettingChangeDetector', () => {
    const detector = new SettingChangeDetector();

    const baseEntity = (): Setting =>
        ({
            id: 1,
            tenantId: 1,
            locationId: null,
            name: 'taxRate',
            valueType: SettingValueType.Number,
            value: '0.08',
        }) as Setting;

    it('returns empty patch when the incoming value serializes to the same stored text', () => {
        const entity = baseEntity();
        const result = detector.detect(entity, { value: 0.08 });
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('detects a changed value', () => {
        const entity = baseEntity();
        const result = detector.detect(entity, { value: 0.0925 });
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ value: 0.0925 });
    });

    it('is a no-op when value is omitted from the dto', () => {
        const entity = baseEntity();
        const result = detector.detect(entity, {} as any);
        expect(result.hasChanges).toBe(false);
    });
});
