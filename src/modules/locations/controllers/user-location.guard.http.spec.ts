import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { createHttpTestApp } from '../../../test/http-test-app';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import {
    TestUser,
    useTestUserAndRoleGuards,
} from '../../../test/test-user-guard';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Location } from '../entities/location.entity';
import { LocationTestUtil } from '../utils/location-test.util';
import { getLocationsTestingModule } from '../utils/locations-testing.module';

const P = `t${Date.now()}`;

/**
 * Guard-only checks for `POST /user-locations` (class-level `@Roles(ROLE_ADMIN)`
 * plus `@LocationScope` on create): the full create path is covered by
 * `user-location.service.spec.ts`. An incomplete body that reaches validation
 * (400) shows the request got past `RoleGuard`.
 */
describe('user location controller (location scope enforcement)', () => {
    let app: INestApplication;
    let tenantRepo: Repository<Tenant>;
    let tenant: Tenant;
    let locationA: Location;
    let locationB: Location;
    let currentUser: TestUser;

    beforeAll(async () => {
        const module: TestingModule = await getLocationsTestingModule();
        tenantRepo = module.get(getRepositoryToken(Tenant));
        const requestContext = module.get<TestRequestContextService>(
            RequestContextService,
        );

        ({
            tenant,
            locations: [locationA, locationB],
        } = await module.get(LocationTestUtil).seedLocations(P, undefined, 2));

        ({ app } = await createHttpTestApp(module, {
            beforeInit: useTestUserAndRoleGuards(
                () => currentUser,
                requestContext,
            ),
        }));
    });

    afterAll(async () => {
        await tenantRepo.delete(tenant.id);
        await app.close();
    });

    const post = (body: Record<string, unknown>) =>
        request(app.getHttpServer()).post('/user-locations').send(body);

    it('rejects an admin at one location assigning users at another with 403', async () => {
        currentUser = {
            tenantId: tenant.id,
            isTenantAdmin: false,
            locations: [{ locationId: locationA.id, roles: ['admin'] }],
        };
        expect((await post({ locationId: locationB.id })).status).toBe(403);
    });

    it('rejects a caller assigned to the location without the admin role there with 403', async () => {
        currentUser = {
            tenantId: tenant.id,
            isTenantAdmin: false,
            locations: [
                { locationId: locationA.id, roles: ['admin'] },
                { locationId: locationB.id, roles: ['manager'] },
            ],
        };
        expect((await post({ locationId: locationB.id })).status).toBe(403);
    });

    it('lets an admin at the target location through to validation', async () => {
        currentUser = {
            tenantId: tenant.id,
            isTenantAdmin: false,
            locations: [{ locationId: locationA.id, roles: ['admin'] }],
        };
        expect((await post({ locationId: locationA.id })).status).toBe(400);
    });
});
