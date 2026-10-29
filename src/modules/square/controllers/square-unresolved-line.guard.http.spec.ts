import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { createHttpTestApp } from '../../../test/http-test-app';
import { TestUser } from '../../../test/test-user-guard';
import { FEATURE_REGISTRY } from '../../feature-flags/utils/feature.registry';
import { Location } from '../../locations/entities/location.entity';
import { LocationTestUtil } from '../../locations/utils/location-test.util';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { SquareAttentionDto } from '../dto/square-attention.dto';
import {
    SquareUnresolvedLineDto,
    SquareUnresolvedLineGroupDto,
} from '../dto/square-unresolved-line.dto';
import { SquareModifierLink } from '../entities/square-modifier-link.entity';
import { SquareOrderIssue } from '../entities/square-order-issue.entity';
import { SquareUnresolvedLine } from '../entities/square-unresolved-line.entity';
import { SquareVariationLink } from '../entities/square-variation-link.entity';
import { getSquareTestingModule } from '../utils/square-testing.module';

const P = `t${Date.now()}`;

/**
 * Access and wiring for the resolution routes (an admin or manager at the
 * line's location) and the attention counts (anyone who can read the
 * location's orders). Conversion behaviour is covered by
 * `square-line-conversion.service.spec.ts`.
 */
describe('square unresolved line + attention controllers (location scope + wiring)', () => {
    let app: INestApplication;
    let lineRepo: Repository<SquareUnresolvedLine>;
    let issueRepo: Repository<SquareOrderIssue>;
    let variationRepo: Repository<SquareVariationLink>;
    let modifierRepo: Repository<SquareModifierLink>;
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
        lineRepo = module.get(getRepositoryToken(SquareUnresolvedLine));
        issueRepo = module.get(getRepositoryToken(SquareOrderIssue));
        variationRepo = module.get(getRepositoryToken(SquareVariationLink));
        modifierRepo = module.get(getRepositoryToken(SquareModifierLink));
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
        testCtx.addCleanupFunction(async () => {
            await lineRepo.delete({ tenantId: tenant.id });
            await issueRepo.delete({ tenantId: tenant.id });
            await modifierRepo.delete({ tenantId: tenant.id });
            await variationRepo.delete({ tenantId: tenant.id });
        });
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    let lineSeq = 0;
    const seedLine = (
        locationId: number,
        overrides: Partial<SquareUnresolvedLine> = {},
    ) =>
        lineRepo.save(
            lineRepo.create({
                tenantId: tenant.id,
                locationId,
                orderId: null,
                squareOrderId: `${P}-order-${++lineSeq}`,
                squareLineUid: 'l-1',
                squareVariationId: `${P}-var`,
                squareItemName: 'Apple Pie',
                squareVariationName: 'Large',
                squareModifiers: [],
                reason: 'unmapped_variation',
                quantity: 1,
                note: null,
                ...overrides,
            }),
        );

    let issueSeq = 0;
    const seedIssue = (
        locationId: number | null,
        status: SquareOrderIssue['status'],
    ) =>
        issueRepo.save({
            tenantId: tenant.id,
            squareLocationId: `${P}-sq-loc`,
            locationId,
            squareOrderId: `${P}-issue-order-${++issueSeq}`,
            squareVersion: '1',
            reason: 'validation_failed',
            detail: null,
            status,
            lastAttemptAt: new Date(),
        });

    describe('resolution routes', () => {
        const base = (locationId = location.id) =>
            `/square/locations/${locationId}/unresolved-lines`;

        it("lists the location's pending lines for a manager there", async () => {
            const line = await seedLine(location.id);
            await seedLine(otherLocation.id);

            const res = await request(app.getHttpServer()).get(base());

            expect(res.status).toBe(200);
            const groups = res.body as SquareUnresolvedLineGroupDto[];
            expect(groups).toHaveLength(1);
            expect(groups[0]).toMatchObject({
                key: `unmapped_variation:${P}-var`,
                variationLinkId: null,
                lines: [{ id: line.id, status: 'pending' }],
            });
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
            expect(
                (await request(app.getHttpServer()).get(base())).status,
            ).toBe(200);
        });

        it.each([
            ['staff at the location', () => at(location.id, 'staff')],
            [
                'a manager at another location',
                () => at(otherLocation.id, 'manager'),
            ],
            [
                'a tenant without SQUARE_INTEGRATION',
                (): TestUser => ({
                    ...at(location.id, 'manager'),
                    features: [],
                }),
            ],
        ])('rejects %s with 403', async (_label, user) => {
            const line = await seedLine(location.id);
            currentUser = user();
            const server = app.getHttpServer() as App;
            expect((await request(server).get(base())).status).toBe(403);
            for (const action of ['dismiss', 'retry', 'disable-variation']) {
                expect(
                    (
                        await request(server).post(
                            `${base()}/${line.id}/${action}`,
                        )
                    ).status,
                ).toBe(403);
            }
            expect(
                (
                    await request(server)
                        .post(`${base()}/${line.id}/map`)
                        .send({ menuItemId: 1, menuItemSizeId: 1 })
                ).status,
            ).toBe(403);
            expect(
                (await lineRepo.findOneByOrFail({ id: line.id })).status,
            ).toBe('pending');
        });

        it('rejects an unauthenticated caller with 401', async () => {
            currentUser = undefined;
            expect(
                (await request(app.getHttpServer()).get(base())).status,
            ).toBe(401);
        });

        it('dismisses a line for a manager there, and 404s from another location', async () => {
            const line = await seedLine(location.id);
            currentUser = {
                ...at(location.id, 'manager'),
                locations: [
                    { locationId: location.id, roles: ['manager'] },
                    { locationId: otherLocation.id, roles: ['manager'] },
                ],
            };
            const server = app.getHttpServer() as App;

            expect(
                (
                    await request(server).post(
                        `${base(otherLocation.id)}/${line.id}/dismiss`,
                    )
                ).status,
            ).toBe(404);
            const res = await request(server).post(
                `${base()}/${line.id}/dismiss`,
            );
            expect(res.status).toBe(200);
            expect((res.body as SquareUnresolvedLineDto).status).toBe(
                'dismissed',
            );
        });

        it('rejects a malformed ad-hoc mapping with 400', async () => {
            const line = await seedLine(location.id, {
                reason: 'ad_hoc',
                squareVariationId: null,
            });
            const res = await request(app.getHttpServer())
                .post(`${base()}/${line.id}/map`)
                .send({ menuItemId: 'pie' });
            expect(res.status).toBe(400);
        });
    });

    describe('attention counts', () => {
        const attention = () =>
            request(app.getHttpServer()).get('/square/attention');

        async function seedAttention(): Promise<void> {
            await seedLine(location.id);
            await seedLine(location.id);
            await seedLine(location.id, { status: 'dismissed' });
            await seedLine(otherLocation.id);
            await seedIssue(location.id, 'open');
            await seedIssue(location.id, 'resolved');
            // An issue no location can see
            await seedIssue(null, 'open');

            const variation = (
                id: string,
                fields: Partial<SquareVariationLink>,
            ) =>
                variationRepo.create({
                    tenantId: tenant.id,
                    squareVariationId: `${P}-${id}`,
                    squareItemId: `${P}-item`,
                    squareItemName: 'Item',
                    squareVariationName: id,
                    menuItemId: null,
                    menuItemSizeId: null,
                    reviewedAt: new Date(),
                    ...fields,
                });
            await variationRepo.save([
                // Unmapped and unreviewed
                variation('unmapped', { reviewedAt: null }),
                // Disabled, or products come from modifiers: not unmapped
                variation('disabled', { enabled: false }),
                variation('by-modifier', { modifierMode: 'modifier_is_item' }),
                // Hidden from the mapping view
                variation('archived', { isArchived: true, reviewedAt: null }),
            ]);

            const modifier = (
                id: string,
                fields: Partial<SquareModifierLink>,
            ) =>
                modifierRepo.create({
                    tenantId: tenant.id,
                    squareModifierId: `${P}-${id}`,
                    squareModifierListId: `${P}-list`,
                    squareModifierListName: 'Flavor',
                    squareModifierName: id,
                    menuItemId: null,
                    menuItemSizeId: null,
                    reviewedAt: new Date(),
                    ...fields,
                });
            await modifierRepo.save([
                modifier('unmapped', { reviewedAt: null }),
                modifier('ignored', { kind: 'ignore' }),
                modifier('deleted', { isDeleted: true, reviewedAt: null }),
            ]);
        }

        const linkCounts = {
            unmappedLinks: { variations: 1, modifiers: 1 },
            unreviewedLinks: { variations: 1, modifiers: 1 },
        };

        it('counts every location for a tenant admin', async () => {
            await seedAttention();
            currentUser = {
                tenantId: tenant.id,
                isTenantAdmin: true,
                locations: [],
            };

            const res = await attention();

            expect(res.status).toBe(200);
            expect(res.body as SquareAttentionDto).toEqual({
                locations: [
                    { locationId: location.id, pendingLines: 2, openIssues: 1 },
                    {
                        locationId: otherLocation.id,
                        pendingLines: 1,
                        openIssues: 0,
                    },
                ],
                ...linkCounts,
            });
        });

        it("counts only the caller's own locations for staff, with no role required", async () => {
            await seedAttention();
            currentUser = at(location.id, 'staff');

            const res = await attention();

            expect(res.status).toBe(200);
            expect(res.body as SquareAttentionDto).toEqual({
                locations: [
                    { locationId: location.id, pendingLines: 2, openIssues: 1 },
                ],
                ...linkCounts,
            });
        });

        it('rejects a tenant without SQUARE_INTEGRATION with 403', async () => {
            currentUser = {
                ...at(location.id, 'staff'),
                features: [FEATURE_REGISTRY.ORDER_MANAGEMENT],
            };
            expect((await attention()).status).toBe(403);
        });

        it('rejects an unauthenticated caller with 401', async () => {
            currentUser = undefined;
            expect((await attention()).status).toBe(401);
        });
    });
});
