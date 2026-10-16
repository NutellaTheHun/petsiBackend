import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { createHttpTestApp } from '../../../test/http-test-app';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import {
    TestUser,
    useTestUserAndRoleGuards,
} from '../../../test/test-user-guard';
import { Location } from '../../locations/entities/location.entity';
import { LocationTestUtil } from '../../locations/utils/location-test.util';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Setting } from '../entities/setting.entity';
import { getSettingsTestingModule } from '../utils/settings-testing.module';

const P = `t${Date.now()}`;

describe('settings controller (role guard enforcement)', () => {
    let app: INestApplication;
    let settingRepo: Repository<Setting>;
    let tenantRepo: Repository<Tenant>;
    let testCtx: DatabaseTestContext;

    let tenant: Tenant;
    let locationA: Location;
    let locationB: Location;
    let currentUser: TestUser;

    const managerAtLocationA = (): TestUser => ({
        tenantId: tenant.id,
        isTenantAdmin: false,
        locations: [{ locationId: locationA.id, roles: ['manager'] }],
    });

    const tenantAdmin = (): TestUser => ({
        tenantId: tenant.id,
        isTenantAdmin: true,
        locations: [],
    });

    beforeAll(async () => {
        const module: TestingModule = await getSettingsTestingModule();
        settingRepo = module.get(getRepositoryToken(Setting));
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

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
        currentUser = managerAtLocationA();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    async function postSetting(body: Record<string, unknown>) {
        const res = await request(app.getHttpServer())
            .post('/settings')
            .send(body);
        if (res.status === 201) {
            testCtx.addCleanupFunction(async () => {
                await settingRepo.delete((res.body as Setting).id);
            });
        }
        return res;
    }

    describe('POST /settings', () => {
        it('rejects a non-admin manager writing a tenant default (no locationId) with 403', async () => {
            const res = await postSetting({
                name: 'orderNumberPrefix',
                value: 'ORD-',
            });
            expect(res.status).toBe(403);
            expect(
                await settingRepo.count({ where: { tenantId: tenant.id } }),
            ).toBe(0);
        });

        it('lets a tenant admin write a tenant default', async () => {
            currentUser = tenantAdmin();
            const res = await postSetting({
                name: 'orderNumberPrefix',
                value: 'ORD-',
            });
            expect(res.status).toBe(201);
            expect((res.body as Setting).locationId).toBeNull();
        });

        it('lets a manager write an override at their own location', async () => {
            const res = await postSetting({
                name: 'orderNumberPrefix',
                locationId: locationA.id,
                value: 'A-',
            });
            expect(res.status).toBe(201);
            expect((res.body as Setting).locationId).toBe(locationA.id);
        });

        it('rejects a manager writing an override at a location they are not assigned to with 403', async () => {
            const res = await postSetting({
                name: 'orderNumberPrefix',
                locationId: locationB.id,
                value: 'B-',
            });
            expect(res.status).toBe(403);
        });
    });
});
