import { Location } from '../../entities/location.entity';
import { locationToUpdateDto } from '../entity-transformers/location.dto.transformer';
import { LocationChangeDetector } from './location.change-detector';

describe('LocationChangeDetector', () => {
    const detector = new LocationChangeDetector();

    const baseEntity = (): Location =>
        ({
            id: 1,
            tenant: { id: 10 },
            name: 'Downtown',
            address: '1 Main St',
            phoneNumber: '555-000-0000',
            email: 'downtown@example.com',
        } as Location);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseEntity();
        const dto = locationToUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('detects tenantId, name, address, phoneNumber, and email changes', () => {
        const entity = baseEntity();
        const dto = locationToUpdateDto(entity, {
            tenantId: 11,
            name: 'Uptown',
            address: '2 Main St',
            phoneNumber: '555-111-1111',
            email: 'uptown@example.com',
        });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({
            tenantId: 11,
            name: 'Uptown',
            address: '2 Main St',
            phoneNumber: '555-111-1111',
            email: 'uptown@example.com',
        });
    });
});
