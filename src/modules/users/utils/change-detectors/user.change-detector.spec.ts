import { User } from '../../entities/user.entities';
import { userToUpdateDto } from '../entity-transformers/user.dto.transformer';
import { UserChangeDetector } from './user.change-detector';

describe('UserChangeDetector', () => {
    const detector = new UserChangeDetector();

    const baseEntity = (): User =>
        ({
            id: 1,
            tenantId: 1,
            name: 'Alice',
            email: 'a@example.com',
            password: 'hashed',
            isTenantAdmin: false,
        } as User);

    const dtoNoPassword = (user: User) => userToUpdateDto(user, { password: undefined });

    it('returns empty patch when dto matches entity (password omitted)', () => {
        const entity = baseEntity();
        const result = detector.detect(entity, dtoNoPassword(entity));
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('detects name change', () => {
        const entity = baseEntity();
        const dto = userToUpdateDto(entity, { name: 'Bob', password: undefined });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ name: 'Bob' });
    });

    it('detects email change', () => {
        const entity = baseEntity();
        const dto = userToUpdateDto(entity, { email: 'new@example.com', password: undefined });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ email: 'new@example.com' });
    });

    it('detects isTenantAdmin change', () => {
        const entity = baseEntity();
        const dto = userToUpdateDto(entity, { isTenantAdmin: true, password: undefined });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ isTenantAdmin: true });
    });

    it('treats defined password in dto as a change', () => {
        const entity = baseEntity();
        const dto = userToUpdateDto(entity, { password: 'new-secret' });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch.password).toBe('new-secret');
    });
});
