import { ChangeDetectorChange } from '../../../common/base/change-detector.base';
import {
    buildCreatedChangeLog,
    detectorChangesToPersistedChanges,
    persistedChangeLogToDto,
} from './change-log-builder';

describe('change-log-builder', () => {
    it('persists aggregate counts for orderedItems', () => {
        const changes: ChangeDetectorChange[] = [
            {
                path: 'orderedItems',
                previousValue: [1, 2],
                nextValue: [
                    { id: 1, quantity: 1 },
                    { createId: 'c1', menuItemId: 3, sizeId: 1, quantity: 1 },
                ],
            },
        ];
        const out = detectorChangesToPersistedChanges(changes);
        expect(out).toEqual([
            {
                op: 'aggregate',
                path: 'orderedItems',
                added: 1,
                removed: 1,
                modified: 1,
            },
        ]);
    });

    it('round-trips persisted JSON to DTO', () => {
        const created = buildCreatedChangeLog({ type: 'user', id: 1 });
        const dto = persistedChangeLogToDto(created);
        expect(dto.kind).toBe('created');
        expect(dto.schemaVersion).toBe(1);
        expect(dto.actor?.type).toBe('user');
        expect(dto.actor?.id).toBe(1);
    });
});
