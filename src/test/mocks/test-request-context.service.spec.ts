import { TestRequestContextService } from './test-request-context.service';

describe('TestRequestContextService', () => {
    let service: TestRequestContextService;

    beforeEach(() => {
        service = new TestRequestContextService();
    });

    it('sets and reads back userId/roles via run', () => {
        service.run(() => {}, { userId: 1, roles: ['admin'] });
        expect(service.get<number>('userId')).toEqual(1);
        expect(service.get<string[]>('roles')).toEqual(['admin']);
    });

    it('sets and reads back tenantId, isTenantAdmin, and locations via setContext', () => {
        const locations = [{ locationId: 2, roles: ['manager'] }];

        service.setContext({ tenantId: 5, isTenantAdmin: true, locations });

        expect(service.get<number>('tenantId')).toEqual(5);
        expect(service.get<boolean>('isTenantAdmin')).toEqual(true);
        expect(service.get<typeof locations>('locations')).toEqual(locations);
    });

    it('getRequestId falls back to a stable test id when unset', () => {
        expect(service.getRequestId()).toEqual('test-request-id');
    });
});
