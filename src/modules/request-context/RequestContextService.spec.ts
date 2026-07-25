import { TestingModule } from '@nestjs/testing';
import { getTenantsTestingModule } from '../tenants/utils/tenants-testing.module';
import { RequestContextService } from './RequestContextService';

describe('RequestContextService (via TenantsModule testing wiring)', () => {
    let contextService: RequestContextService;

    beforeAll(async () => {
        const module: TestingModule = await getTenantsTestingModule();
        contextService = module.get(RequestContextService);
    });

    it('sets and reads back tenantId, isTenantAdmin, and locations', () => {
        const locations = [{ locationId: 1, roles: ['manager'] }];

        contextService.run(() => {}, {
            tenantId: 5,
            isTenantAdmin: true,
            locations,
        });

        expect(contextService.get<number>('tenantId')).toEqual(5);
        expect(contextService.get<boolean>('isTenantAdmin')).toEqual(true);
        expect(contextService.get<typeof locations>('locations')).toEqual(locations);
    });

    it('does not disturb existing userId/roles keys', () => {
        contextService.run(() => {}, { userId: 42, roles: ['admin'] });

        expect(contextService.get<number>('userId')).toEqual(42);
        expect(contextService.get<string[]>('roles')).toEqual(['admin']);
    });
});
