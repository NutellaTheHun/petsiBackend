import { Tenant } from '../../entities/tenant.entity';
import { tenantToUpdateDto } from '../entity-transformers/tenant.dto.transformer';
import { TenantChangeDetector } from './tenant.change-detector';

describe('TenantChangeDetector', () => {
    const detector = new TenantChangeDetector();

    const baseEntity = (): Tenant =>
        ({ id: 1, name: 'Petsi Pies', subdomain: 'petsi' } as Tenant);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseEntity();
        const dto = tenantToUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('detects name and subdomain changes', () => {
        const entity = baseEntity();
        const dto = tenantToUpdateDto(entity, { name: 'Petsi Pies Renamed', subdomain: 'petsi2' });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ name: 'Petsi Pies Renamed', subdomain: 'petsi2' });
    });
});
