import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { createHttpTestApp } from '../../../test/http-test-app';
import { TestUser } from '../../../test/test-user-guard';
import { Location } from '../../locations/entities/location.entity';
import { LocationTestUtil } from '../../locations/utils/location-test.util';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { SquareLocationLinkDto } from '../dto/square-location-link.dto';
import { SquareLocationLink } from '../entities/square-location-link.entity';
import { getSquareTestingModule } from '../utils/square-testing.module';

const P = `t${Date.now()}`;

describe('square location link controller (access + wiring)', () => {
    let app: INestApplication;
    let linkRepo: Repository<SquareLocationLink>;
    let tenantRepo: Repository<Tenant>;
    let testCtx: DatabaseTestContext;

    let tenant: Tenant;
    let location: Location;
    let currentUser: TestUser | undefined;

    const tenantAdmin = (): TestUser => ({
        tenantId: tenant.id,
        isTenantAdmin: true,
        locations: [],
    });

    beforeAll(async () => {
        const module: TestingModule = await getSquareTestingModule();
        linkRepo = module.get(getRepositoryToken(SquareLocationLink));
        tenantRepo = module.get(getRepositoryToken(Tenant));

        ({
            tenant,
            locations: [location],
        } = await module.get(LocationTestUtil).seedLocations(P, undefined, 1));

        ({ app } = await createHttpTestApp(module, {
            user: () => currentUser,
        }));
    });

    afterAll(async () => {
        await linkRepo.delete({ tenantId: tenant.id });
        await tenantRepo.delete(tenant.id);
        await app.close();
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
        currentUser = tenantAdmin();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    async function seedLink(suffix: string): Promise<SquareLocationLink> {
        const link = await linkRepo.save({
            tenantId: tenant.id,
            squareLocationId: `${P}-${suffix}`,
            squareName: `${P} ${suffix}`,
            squareStatus: 'ACTIVE',
            timezone: 'America/New_York',
        });
        testCtx.addCleanupFunction(async () => {
            await linkRepo.delete(link.id);
        });
        return link;
    }

    const server = () => request(app.getHttpServer());

    it('lists links without tenant or timestamp internals', async () => {
        const link = await seedLink('list');
        const res = await server().get('/square/location-links');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            {
                id: link.id,
                squareLocationId: `${P}-list`,
                squareName: `${P} list`,
                squareStatus: 'ACTIVE',
                timezone: 'America/New_York',
                enabled: false,
                locationId: null,
            },
        ]);
    });

    it('rejects enabling an unmapped link with 400 VALIDATION_ERROR', async () => {
        const link = await seedLink('unmapped');
        const res = await server()
            .patch(`/square/location-links/${link.id}/enabled`)
            .send({ enabled: true });
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({ code: 'VALIDATION_ERROR' });
    });

    it('maps and enables a link', async () => {
        const link = await seedLink('mapped');
        const mapped = await server()
            .patch(`/square/location-links/${link.id}/location`)
            .send({ locationId: location.id });
        expect(mapped.status).toBe(200);

        const enabled = await server()
            .patch(`/square/location-links/${link.id}/enabled`)
            .send({ enabled: true });
        expect(enabled.status).toBe(200);
        expect(enabled.body).toMatchObject({
            locationId: location.id,
            enabled: true,
        });
    });

    it('creates a Petsi location that GET /locations shows straight away', async () => {
        const link = await seedLink('new-site');
        // Prime LocationController's findAll cache
        expect((await server().get('/locations')).status).toBe(200);

        const res = await server().post(
            `/square/location-links/${link.id}/create-location`,
        );
        expect(res.status).toBe(201);
        const { locationId } = res.body as SquareLocationLinkDto;
        expect(locationId).toEqual(expect.any(Number));

        const list = await server().get('/locations');
        expect(list.status).toBe(200);
        expect(JSON.stringify(list.body)).toContain(`${P} new-site`);
    });

    const routes = [
        [
            'GET /square/location-links',
            () => server().get('/square/location-links'),
        ],
        [
            'PATCH /square/location-links/:id/location',
            () =>
                server()
                    .patch('/square/location-links/1/location')
                    .send({ locationId: null }),
        ],
        [
            'POST /square/location-links/:id/create-location',
            () => server().post('/square/location-links/1/create-location'),
        ],
        [
            'PATCH /square/location-links/:id/enabled',
            () =>
                server()
                    .patch('/square/location-links/1/enabled')
                    .send({ enabled: false }),
        ],
    ] as const;

    describe.each(routes)('%s', (_route, send) => {
        it('rejects a tenant without SQUARE_INTEGRATION with 403', async () => {
            currentUser = { ...tenantAdmin(), features: ['ORDER_MANAGEMENT'] };
            expect((await send()).status).toBe(403);
        });

        it('rejects a location admin who is not a tenant admin with 403', async () => {
            currentUser = {
                tenantId: tenant.id,
                isTenantAdmin: false,
                locations: [{ locationId: location.id, roles: ['admin'] }],
            };
            expect((await send()).status).toBe(403);
        });

        it('rejects an unauthenticated request with 401', async () => {
            currentUser = undefined;
            expect((await send()).status).toBe(401);
        });
    });
});
