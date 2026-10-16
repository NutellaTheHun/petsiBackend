import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { createHttpTestApp } from '../../../test/http-test-app';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { TestUser, useTestUserAndRoleGuards } from '../../../test/test-user-guard';
import { Location } from '../../locations/entities/location.entity';
import { LocationTestUtil } from '../../locations/utils/location-test.util';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { InventoryArea } from '../entities/inventory-area.entity';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';

const P = `t${Date.now()}`;

describe('inventory area controller (location scope enforcement)', () => {
    let app: INestApplication;
    let areaRepo: Repository<InventoryArea>;
    let tenantRepo: Repository<Tenant>;
    let testCtx: DatabaseTestContext;

    let tenant: Tenant;
    let locationA: Location;
    let locationB: Location;
    let currentUser: TestUser;

    const staffAtLocationA = (): TestUser => ({
        tenantId: tenant.id,
        isTenantAdmin: false,
        locations: [{ locationId: locationA.id, roles: ['staff'] }],
    });

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();
        areaRepo = module.get(getRepositoryToken(InventoryArea));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        const requestContext = module.get(RequestContextService) as TestRequestContextService;

        ({ tenant, locations: [locationA, locationB] } =
            await module.get(LocationTestUtil).seedLocations(P, undefined, 2));

        ({ app } = await createHttpTestApp(module, {
            beforeInit: useTestUserAndRoleGuards(() => currentUser, requestContext),
        }));
    });

    afterAll(async () => {
        await tenantRepo.delete(tenant.id);
        await app.close();
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
        currentUser = staffAtLocationA();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    async function postArea(body: Record<string, unknown>) {
        const res = await request(app.getHttpServer()).post('/inventory-areas').send(body);
        if (res.status === 201) {
            testCtx.addCleanupFunction(async () => { await areaRepo.delete(res.body.id); });
        }
        return res;
    }

    describe('POST /inventory-areas', () => {
        it('lets a caller create an area at a location they are assigned to', async () => {
            const res = await postArea({ name: `${P}-walk-in`, locationId: locationA.id });
            expect(res.status).toBe(201);
            expect(res.body.locationId).toBe(locationA.id);
        });

        it('rejects a location the caller is not assigned to with 403', async () => {
            const res = await postArea({ name: `${P}-elsewhere`, locationId: locationB.id });
            expect(res.status).toBe(403);
            expect(await areaRepo.count({ where: { name: `${P}-elsewhere` } })).toBe(0);
        });

        it('lets a tenant admin create at any location in the tenant', async () => {
            currentUser = { tenantId: tenant.id, isTenantAdmin: true, locations: [] };
            const res = await postArea({ name: `${P}-admin-area`, locationId: locationB.id });
            expect(res.status).toBe(201);
        });
    });

    describe('PUT /inventory-areas/:id', () => {
        let area: InventoryArea;

        beforeEach(async () => {
            area = (await postArea({ name: `${P}-put-area`, locationId: locationA.id })).body;
        });

        it('updates the area when locationId is unchanged', async () => {
            const res = await request(app.getHttpServer())
                .put(`/inventory-areas/${area.id}`)
                .send({ name: `${P}-put-area-renamed`, locationId: locationA.id });
            expect(res.status).toBe(200);
            expect(res.body.name).toBe(`${P}-put-area-renamed`);
        });

        it('rejects moving the area to another location with IMMUTABLE_FIELD', async () => {
            currentUser = { tenantId: tenant.id, isTenantAdmin: true, locations: [] };
            const res = await request(app.getHttpServer())
                .put(`/inventory-areas/${area.id}`)
                .send({ name: area.name, locationId: locationB.id });
            expect(res.status).toBe(400);
            expect(res.body.code).toBe('VALIDATION_ERROR');
            expect(JSON.stringify(res.body.details)).toContain('IMMUTABLE_FIELD');
            const row = await areaRepo.findOneOrFail({ where: { id: area.id } });
            expect(row.locationId).toBe(locationA.id);
        });
    });
});
