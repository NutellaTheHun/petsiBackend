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
import { SquareOrderIssueDto } from '../dto/square-order-issue.dto';
import { SquareOrderIssue } from '../entities/square-order-issue.entity';
import { getSquareTestingModule } from '../utils/square-testing.module';

const P = `t${Date.now()}`;

/**
 * Access and wiring for the order-issue routes: an admin or manager at the
 * issue's location. Retry and ingest behaviour are covered by
 * `square-order-issue.service.spec.ts`.
 */
describe('square order issue controller (location scope + wiring)', () => {
    let app: INestApplication;
    let issueRepo: Repository<SquareOrderIssue>;
    let locationRepo: Repository<Location>;
    let tenantRepo: Repository<Tenant>;
    let testCtx: DatabaseTestContext;

    let tenant: Tenant;
    let location: Location;
    let otherLocation: Location;
    let currentUser: TestUser | undefined;

    const at = (locationId: number, ...roles: string[]): TestUser => ({
        tenantId: tenant.id,
        isTenantAdmin: false,
        locations: [{ locationId, roles }],
    });

    beforeAll(async () => {
        const module: TestingModule = await getSquareTestingModule();
        issueRepo = module.get(getRepositoryToken(SquareOrderIssue));
        locationRepo = module.get(getRepositoryToken(Location));
        tenantRepo = module.get(getRepositoryToken(Tenant));

        ({
            tenant,
            locations: [location, otherLocation],
        } = await module.get(LocationTestUtil).seedLocations(P, undefined, 2));

        ({ app } = await createHttpTestApp(module, {
            user: () => currentUser,
        }));
    });

    afterAll(async () => {
        await locationRepo.delete({ tenantId: tenant.id });
        await tenantRepo.delete(tenant.id);
        await app.close();
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
        currentUser = at(location.id, 'manager');
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    async function seedIssue(): Promise<SquareOrderIssue> {
        const issue = await issueRepo.save({
            tenantId: tenant.id,
            squareLocationId: `${P}-sq-loc`,
            locationId: location.id,
            squareOrderId: `${P}-order`,
            squareVersion: '9007199254740993',
            reason: 'validation_failed',
            detail: {
                validationErrors: {
                    errorPayload: [
                        {
                            errorCode: 'MISSING_PROPERTY',
                            fields: ['recipient'],
                        },
                    ],
                },
            },
            lastAttemptAt: new Date('2026-10-29T12:00:00Z'),
        });
        testCtx.addCleanupFunction(async () => {
            await issueRepo.delete({ tenantId: tenant.id });
        });
        return issue;
    }

    const list = (locationId = location.id) =>
        request(app.getHttpServer()).get(
            `/square/locations/${locationId}/order-issues`,
        );
    const dismiss = (id: number, locationId = location.id) =>
        request(app.getHttpServer()).post(
            `/square/locations/${locationId}/order-issues/${id}/dismiss`,
        );

    it("lists the location's open issues for a manager there", async () => {
        const issue = await seedIssue();
        const res = await list();
        expect(res.status).toBe(200);
        expect(res.body as SquareOrderIssueDto[]).toEqual([
            {
                id: issue.id,
                squareOrderId: `${P}-order`,
                squareLocationId: `${P}-sq-loc`,
                locationId: location.id,
                orderId: null,
                squareVersion: '9007199254740993',
                reason: 'validation_failed',
                detail: issue.detail,
                status: 'open',
                lastAttemptAt: '2026-10-29T12:00:00.000Z',
                createdAt: issue.createdAt.toISOString(),
            },
        ]);
    });

    it.each([
        ['an admin at the location', () => at(location.id, 'admin')],
        [
            'a tenant admin',
            (): TestUser => ({
                tenantId: tenant.id,
                isTenantAdmin: true,
                locations: [],
            }),
        ],
    ])('lets %s through', async (_label, user) => {
        currentUser = user();
        expect((await list()).status).toBe(200);
    });

    it.each([
        ['staff at the location', () => at(location.id, 'staff')],
        [
            'a manager at another location',
            () => at(otherLocation.id, 'manager'),
        ],
        [
            'a tenant without SQUARE_INTEGRATION',
            (): TestUser => ({ ...at(location.id, 'manager'), features: [] }),
        ],
    ])('rejects %s with 403', async (_label, user) => {
        const issue = await seedIssue();
        currentUser = user();
        expect((await list()).status).toBe(403);
        expect((await dismiss(issue.id)).status).toBe(403);
        expect(
            (
                await request(app.getHttpServer()).post(
                    `/square/locations/${location.id}/order-issues/${issue.id}/retry`,
                )
            ).status,
        ).toBe(403);
        expect((await issueRepo.findOneByOrFail({ id: issue.id })).status).toBe(
            'open',
        );
    });

    it('rejects an unauthenticated caller with 401', async () => {
        currentUser = undefined;
        expect((await list()).status).toBe(401);
    });

    it('dismisses an issue for a manager there, and 404s from another location', async () => {
        const issue = await seedIssue();
        currentUser = {
            ...at(location.id, 'manager'),
            locations: [
                { locationId: location.id, roles: ['manager'] },
                { locationId: otherLocation.id, roles: ['manager'] },
            ],
        };

        expect((await dismiss(issue.id, otherLocation.id)).status).toBe(404);
        const res = await dismiss(issue.id);
        expect(res.status).toBe(200);
        expect((res.body as SquareOrderIssueDto).status).toBe('dismissed');
    });

    it('rejects an unknown status filter with 400', async () => {
        const res = await list().query({ status: 'closed' });
        expect(res.status).toBe(400);
    });
});
