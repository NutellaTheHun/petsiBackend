import { Role } from '../../../roles/entities/role.entity';
import { UserLocation } from '../../entities/user-location.entity';
import { UserLocationChangeDetector } from './user-location.change-detector';

describe('UserLocationChangeDetector', () => {
    const detector = new UserLocationChangeDetector();

    const baseEntity = (): UserLocation =>
        ({
            id: 1,
            tenantId: 1,
            locationId: 10,
            roles: [{ id: 100 } as Role, { id: 200 } as Role],
        } as UserLocation);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseEntity();
        const result = detector.detect(entity, { locationId: 10, roleIds: [200, 100] });
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('detects locationId change', () => {
        const entity = baseEntity();
        const result = detector.detect(entity, { locationId: 20, roleIds: [100, 200] });
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ locationId: 20 });
    });

    it('does not flag roleIds when same ids in different order', () => {
        const entity = baseEntity();
        const result = detector.detect(entity, { locationId: 10, roleIds: [200, 100] });
        expect(result.hasChanges).toBe(false);
    });

    it('detects roleIds change', () => {
        const entity = baseEntity();
        const result = detector.detect(entity, { locationId: 10, roleIds: [300] });
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ roleIds: [300] });
    });
});
