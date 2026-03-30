import { Role } from '../../entities/role.entity';
import { roleToUpdateDto } from '../entity-transformers/role.dto.transformer';
import { RoleChangeDetector } from './role.change-detector';

describe('RoleChangeDetector', () => {
    const detector = new RoleChangeDetector();

    const baseEntity = (): Role => ({ id: 1, name: 'Admin' } as Role);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseEntity();
        const dto = roleToUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('detects name change', () => {
        const entity = baseEntity();
        const dto = roleToUpdateDto(entity, { name: 'SuperAdmin' });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ name: 'SuperAdmin' });
    });
});
