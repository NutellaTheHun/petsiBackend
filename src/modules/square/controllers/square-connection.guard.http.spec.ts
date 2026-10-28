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
import { SquareConnection } from '../entities/square-connection.entity';
import { getSquareTestingModule } from '../utils/square-testing.module';
import { SquareTestUtil } from '../utils/square-test.util';

const P = `t${Date.now()}`;

describe('square connection controller (status + access)', () => {
    let app: INestApplication;
    let connectionRepo: Repository<SquareConnection>;
    let tenantRepo: Repository<Tenant>;
    let squareTestUtil: SquareTestUtil;
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
        connectionRepo = module.get(getRepositoryToken(SquareConnection));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        squareTestUtil = module.get(SquareTestUtil);

        ({
            tenant,
            locations: [location],
        } = await module.get(LocationTestUtil).seedLocations(P, undefined, 1));

        ({ app } = await createHttpTestApp(module, {
            user: () => currentUser,
        }));
    });

    afterAll(async () => {
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

    const getStatus = () =>
        request(app.getHttpServer()).get('/square/connection');

    it('returns not_connected for a tenant with no connection', async () => {
        const res = await getStatus();
        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            status: 'not_connected',
            businessName: null,
        });
    });

    it('returns status and business name, and no token fields', async () => {
        const connection = await squareTestUtil.seedConnection(P, tenant.id, {
            status: 'needs_reauth',
        });
        testCtx.addCleanupFunction(async () => {
            await connectionRepo.delete(connection.id);
        });

        const res = await getStatus();
        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            status: 'needs_reauth',
            businessName: `${P}-business`,
        });
        expect(res.text).not.toMatch(/token/i);
    });

    it('rejects a tenant without SQUARE_INTEGRATION with 403', async () => {
        currentUser = { ...tenantAdmin(), features: ['ORDER_MANAGEMENT'] };
        const res = await getStatus();
        expect(res.status).toBe(403);
    });

    it('rejects a location admin who is not a tenant admin with 403', async () => {
        currentUser = {
            tenantId: tenant.id,
            isTenantAdmin: false,
            locations: [{ locationId: location.id, roles: ['admin'] }],
        };
        const res = await getStatus();
        expect(res.status).toBe(403);
    });

    it('rejects an unauthenticated request with 401', async () => {
        currentUser = undefined;
        const res = await getStatus();
        expect(res.status).toBe(401);
    });
});
