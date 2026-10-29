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
import { SquareCatalogDto } from '../dto/square-catalog.dto';
import { SquareItemHint } from '../entities/square-item-hint.entity';
import { SquareVariationLink } from '../entities/square-variation-link.entity';
import { getSquareTestingModule } from '../utils/square-testing.module';

const P = `t${Date.now()}`;

describe('square catalog controller (access + wiring)', () => {
    let app: INestApplication;
    let hintRepo: Repository<SquareItemHint>;
    let variationRepo: Repository<SquareVariationLink>;
    let tenantRepo: Repository<Tenant>;
    let testCtx: DatabaseTestContext;

    let tenant: Tenant;
    let location: Location;
    let currentUser: TestUser | undefined;

    const withRoles = (...roles: string[]): TestUser => ({
        tenantId: tenant.id,
        isTenantAdmin: false,
        locations: [{ locationId: location.id, roles }],
    });

    beforeAll(async () => {
        const module: TestingModule = await getSquareTestingModule();
        hintRepo = module.get(getRepositoryToken(SquareItemHint));
        variationRepo = module.get(getRepositoryToken(SquareVariationLink));
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
        await tenantRepo.delete(tenant.id);
        await app.close();
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
        currentUser = withRoles('manager');
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    async function seedItem(): Promise<{
        hint: SquareItemHint;
        link: SquareVariationLink;
    }> {
        const hint = await hintRepo.save({
            tenantId: tenant.id,
            squareItemId: `${P}-item`,
            squareItemName: `${P} Pie`,
        });
        const link = await variationRepo.save({
            tenantId: tenant.id,
            squareVariationId: `${P}-var`,
            squareItemId: `${P}-item`,
            squareItemName: `${P} Pie`,
            squareVariationName: 'Large',
            squareVersion: '9007199254740993',
        });
        testCtx.addCleanupFunction(async () => {
            await variationRepo.delete({ tenantId: tenant.id });
            await hintRepo.delete({ tenantId: tenant.id });
        });
        return { hint, link };
    }

    const getCatalog = (query: Record<string, string> = {}) =>
        request(app.getHttpServer()).get('/square/catalog').query(query);

    it('lists items with their variation mappings', async () => {
        const { hint, link } = await seedItem();
        const res = await getCatalog();
        expect(res.status).toBe(200);
        const body = res.body as SquareCatalogDto;
        expect(body.categories).toEqual([]);
        expect(body.items).toEqual([
            {
                id: hint.id,
                squareItemId: `${P}-item`,
                squareItemName: `${P} Pie`,
                squareCategoryId: null,
                isArchived: false,
                isDeleted: false,
                menuItemId: null,
                variations: [
                    {
                        id: link.id,
                        squareVariationId: `${P}-var`,
                        squareVariationName: 'Large',
                        squareVersion: '9007199254740993',
                        isArchived: false,
                        isDeleted: false,
                        enabled: true,
                        menuItemId: null,
                        menuItemSizeId: null,
                        modifierMode: 'none',
                        mappingSource: 'derived',
                        reviewedAt: null,
                    },
                ],
            },
        ]);
    });

    it('rejects an unknown view with 400', async () => {
        expect((await getCatalog({ view: 'deleted' })).status).toBe(400);
    });

    it.each([
        ['an admin at a location', () => withRoles('admin')],
        ['a manager at a location', () => withRoles('manager')],
        [
            'a tenant admin',
            (): TestUser => ({
                tenantId: tenant.id,
                isTenantAdmin: true,
                locations: [],
            }),
        ],
    ])('allows %s', async (_who, user) => {
        currentUser = user();
        expect((await getCatalog()).status).toBe(200);
    });

    it('rejects staff with 403', async () => {
        currentUser = withRoles('staff');
        expect((await getCatalog()).status).toBe(403);
    });

    describe('mapping routes', () => {
        const overrideVariation = (id: number, body: object) =>
            request(app.getHttpServer())
                .patch(`/square/catalog/variations/${id}`)
                .send(body);

        it.each([
            ['an admin at a location', 'admin', 200],
            ['a manager at a location', 'manager', 200],
            ['staff', 'staff', 403],
        ])('%s (%s) gets %i', async (_who, role, status) => {
            const { link } = await seedItem();
            currentUser = withRoles(role);
            expect(
                (await overrideVariation(link.id, { enabled: false })).status,
            ).toBe(status);
            expect(
                (
                    await request(app.getHttpServer())
                        .post('/square/catalog/review')
                        .send({ variationLinkIds: [link.id] })
                ).status,
            ).toBe(status === 200 ? 204 : status);
            expect(
                (
                    await request(app.getHttpServer()).get(
                        '/square/catalog/size-alias-suggestions',
                    )
                ).status,
            ).toBe(status);
        });

        it('returns a VALIDATION_ERROR tree for container_contents on an unmapped link', async () => {
            const { link } = await seedItem();
            const res = await overrideVariation(link.id, {
                modifierMode: 'container_contents',
            });
            expect(res.status).toBe(400);
            expect(res.body).toMatchObject({
                code: 'VALIDATION_ERROR',
                details: {
                    validationErrors: {
                        id: link.id,
                        errorPayload: [
                            {
                                errorCode: 'INCONSISTENT_STATE',
                                fields: ['modifierMode'],
                            },
                        ],
                    },
                },
            });
        });

        it('rejects an unknown modifier mode with 400 INVALID_REQUEST', async () => {
            const { link } = await seedItem();
            const res = await overrideVariation(link.id, {
                modifierMode: 'everything',
            });
            expect(res.status).toBe(400);
            expect(res.body).toMatchObject({ code: 'INVALID_REQUEST' });
        });
    });

    it('rejects a tenant without SQUARE_INTEGRATION with 403', async () => {
        currentUser = { ...withRoles('admin'), features: ['ORDER_MANAGEMENT'] };
        expect((await getCatalog()).status).toBe(403);
    });

    it('rejects an unauthenticated request with 401', async () => {
        currentUser = undefined;
        expect((await getCatalog()).status).toBe(401);
    });
});
