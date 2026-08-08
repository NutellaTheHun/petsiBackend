import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleGuard } from './role.guard';

function buildContext(user: any, request: Record<string, any> = {}): ExecutionContext {
    const req = { user, params: {}, query: {}, body: {}, ...request };
    return {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
            getRequest: () => req,
        }),
    } as unknown as ExecutionContext;
}

describe('RoleGuard', () => {
    let reflector: Reflector;
    let guard: RoleGuard;

    beforeEach(() => {
        reflector = new Reflector();
        guard = new RoleGuard(reflector);
    });

    function mockMetadata(
        roles: string[] | undefined,
        locationScope?: { source: string; key: string },
    ) {
        jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: unknown) => {
            if (key === 'roles') return roles;
            if (key === 'locationScope') return locationScope;
            return undefined;
        });
    }

    it('allows the request through when no roles are required', () => {
        mockMetadata(undefined);
        const context = buildContext({ locations: [] });
        expect(guard.canActivate(context)).toBe(true);
    });

    it('denies the request when there is no authenticated user', () => {
        mockMetadata(['admin']);
        const context = buildContext(undefined);
        expect(guard.canActivate(context)).toBe(false);
    });

    it('tenant-wide check passes when the required role is held at any location', () => {
        mockMetadata(['manager']);
        const context = buildContext({
            isTenantAdmin: false,
            locations: [
                { locationId: 1, roles: ['staff'] },
                { locationId: 2, roles: ['manager'] },
            ],
        });
        expect(guard.canActivate(context)).toBe(true);
    });

    it('tenant-wide check fails when the required role is held at no location', () => {
        mockMetadata(['admin']);
        const context = buildContext({
            isTenantAdmin: false,
            locations: [{ locationId: 1, roles: ['staff'] }],
        });
        expect(guard.canActivate(context)).toBe(false);
    });

    it('isTenantAdmin passes regardless of location, even for a location-scoped route', () => {
        mockMetadata(['admin'], { source: 'params', key: 'locationId' });
        const context = buildContext(
            { isTenantAdmin: true, locations: [] },
            { params: { locationId: '99' } },
        );
        expect(guard.canActivate(context)).toBe(true);
    });

    it('location-scoped check passes when the role is held at the acted-on location', () => {
        mockMetadata(['manager'], { source: 'params', key: 'locationId' });
        const context = buildContext(
            {
                isTenantAdmin: false,
                locations: [
                    { locationId: 1, roles: ['staff'] },
                    { locationId: 2, roles: ['manager'] },
                ],
            },
            { params: { locationId: '2' } },
        );
        expect(guard.canActivate(context)).toBe(true);
    });

    it('location-scoped check fails when the role is held only at a different location', () => {
        mockMetadata(['manager'], { source: 'params', key: 'locationId' });
        const context = buildContext(
            {
                isTenantAdmin: false,
                locations: [{ locationId: 1, roles: ['manager'] }],
            },
            { params: { locationId: '2' } },
        );
        expect(guard.canActivate(context)).toBe(false);
    });

    it('location-scoped check reads the target locationId from the DTO body when configured', () => {
        mockMetadata(['manager'], { source: 'body', key: 'locationId' });
        const context = buildContext(
            {
                isTenantAdmin: false,
                locations: [{ locationId: 5, roles: ['manager'] }],
            },
            { body: { locationId: 5 } },
        );
        expect(guard.canActivate(context)).toBe(true);
    });

    it('location-scoped check fails when the target locationId cannot be resolved from the request', () => {
        mockMetadata(['manager'], { source: 'params', key: 'locationId' });
        const context = buildContext(
            {
                isTenantAdmin: false,
                locations: [{ locationId: 5, roles: ['manager'] }],
            },
            { params: {} },
        );
        expect(guard.canActivate(context)).toBe(false);
    });
});
