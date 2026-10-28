import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Square } from 'square';
import { Repository } from 'typeorm';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { Location } from '../../locations/entities/location.entity';
import { LocationTestUtil } from '../../locations/utils/location-test.util';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { SquareClientFactory } from '../client/square-client.factory';
import { SquareConnection } from '../entities/square-connection.entity';
import { SquareLocationLink } from '../entities/square-location-link.entity';
import { FakeSquareClientFactory } from '../utils/fake-square-client.factory';
import { getSquareTestingModule } from '../utils/square-testing.module';
import { SquareTestUtil } from '../utils/square-test.util';
import { SquareLocationImportService } from './square-location-import.service';
import { SquareLocationLinkService } from './square-location-link.service';
import { SquareLocationSyncService } from './square-location-sync.service';

const P = `t${Date.now()}`;

describe('Square location links', () => {
    let module: TestingModule;
    let fake: FakeSquareClientFactory;
    let linkRepo: Repository<SquareLocationLink>;
    let locationRepo: Repository<Location>;
    let connectionRepo: Repository<SquareConnection>;
    let tenantRepo: Repository<Tenant>;
    let syncService: SquareLocationSyncService;
    let linkService: SquareLocationLinkService;
    let importService: SquareLocationImportService;
    let requestContext: TestRequestContextService;
    let testCtx: DatabaseTestContext;

    let tenant: Tenant;
    let otherTenant: Tenant;
    let connection: SquareConnection;
    // Petsi locations: one unique name, two sharing a name (ambiguous)
    let downtown: Location;
    let foreignLocation: Location;

    beforeAll(async () => {
        module = await getSquareTestingModule();
        fake = module.get(SquareClientFactory);
        linkRepo = module.get(getRepositoryToken(SquareLocationLink));
        locationRepo = module.get(getRepositoryToken(Location));
        connectionRepo = module.get(getRepositoryToken(SquareConnection));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        syncService = module.get(SquareLocationSyncService);
        linkService = module.get(SquareLocationLinkService);
        importService = module.get(SquareLocationImportService);
        requestContext = module.get(RequestContextService);

        const locationTestUtil = module.get(LocationTestUtil);
        tenant = await locationTestUtil.seedTenant(P);
        otherTenant = await locationTestUtil.seedTenant(`${P}-other`);
        downtown = await locationRepo.save({
            tenantId: tenant.id,
            name: `${P} Downtown`,
        });
        await locationRepo.save([
            { tenantId: tenant.id, name: `${P} Twin` },
            { tenantId: tenant.id, name: `${P}  twin ` },
        ]);
        // Same name as `downtown`, but another tenant's: never a candidate
        foreignLocation = await locationRepo.save({
            tenantId: otherTenant.id,
            name: `${P} Downtown`,
        });
        connection = await module
            .get(SquareTestUtil)
            .seedConnection(P, tenant.id);
    });

    afterAll(async () => {
        await linkRepo.delete({ tenantId: tenant.id });
        await connectionRepo.delete(connection.id);
        // Locations cascade with their tenant
        await tenantRepo.delete([tenant.id, otherTenant.id]);
        await module.close();
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
        fake.reset();
        requestContext.setContext({ tenantId: tenant.id });
        testCtx.addCleanupFunction(async () => {
            await linkRepo.delete({ tenantId: tenant.id });
        });
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    function stubLocations(locations: Square.Location[]) {
        fake.tenantApi.locations.list = () => Promise.resolve({ locations });
    }

    const squareLocation = (
        id: string,
        name: string,
        overrides: Partial<Square.Location> = {},
    ): Square.Location => ({
        id: `${P}-${id}`,
        name,
        status: 'ACTIVE',
        timezone: 'America/New_York',
        ...overrides,
    });

    const findLink = (id: string) =>
        linkRepo.findOneByOrFail({
            tenantId: tenant.id,
            squareLocationId: `${P}-${id}`,
        });

    describe('sync', () => {
        it('creates one disabled link per Square location with its Square fields', async () => {
            stubLocations([
                squareLocation('a', `${P} Kiosk`),
                squareLocation('b', `${P} Warehouse`, {
                    status: 'INACTIVE',
                    timezone: 'America/Chicago',
                }),
            ]);
            await syncService.sync(connection);

            const links = await linkRepo.find({
                where: { tenantId: tenant.id },
            });
            expect(links).toHaveLength(2);
            expect(await findLink('b')).toMatchObject({
                squareName: `${P} Warehouse`,
                squareStatus: 'INACTIVE',
                timezone: 'America/Chicago',
                enabled: false,
                locationId: null,
            });
            expect(links.every((link) => !link.enabled)).toBe(true);
        });

        it('auto-matches an exact normalized name with exactly one candidate', async () => {
            stubLocations([
                squareLocation('a', `  ${P}   DOWNTOWN `),
                squareLocation('b', `${P} Twin`),
                squareLocation('c', `${P} Downtown East`),
            ]);
            await syncService.sync(connection);

            expect((await findLink('a')).locationId).toBe(downtown.id);
            // Two Petsi locations normalize to the same name: ambiguous
            expect((await findLink('b')).locationId).toBeNull();
            // Not an exact match
            expect((await findLink('c')).locationId).toBeNull();
            expect((await findLink('a')).locationId).not.toBe(
                foreignLocation.id,
            );
        });

        it('refreshes Square fields on re-sync without touching the mapping or enabled', async () => {
            stubLocations([squareLocation('a', `${P} Kiosk`)]);
            await syncService.sync(connection);
            const link = await findLink('a');
            await linkService.setLocationForCurrentTenant(link.id, downtown.id);
            await linkService.setEnabledForCurrentTenant(link.id, true);

            // Renamed in Square to exactly another Petsi location's name
            stubLocations([
                squareLocation('a', `${P} Twin`, {
                    status: 'INACTIVE',
                    timezone: 'America/Denver',
                }),
            ]);
            await syncService.sync(connection);

            expect(await findLink('a')).toMatchObject({
                id: link.id,
                squareName: `${P} Twin`,
                squareStatus: 'INACTIVE',
                timezone: 'America/Denver',
                enabled: true,
                locationId: downtown.id,
            });
        });

        it('does not auto-match an existing unmapped link on re-sync', async () => {
            stubLocations([squareLocation('a', `${P} Kiosk`)]);
            await syncService.sync(connection);

            stubLocations([squareLocation('a', `${P} Downtown`)]);
            await syncService.sync(connection);
            expect((await findLink('a')).locationId).toBeNull();
        });

        it('keeps links for locations Square no longer returns', async () => {
            stubLocations([
                squareLocation('a', `${P} Kiosk`),
                squareLocation('b', `${P} Truck`),
            ]);
            await syncService.sync(connection);
            stubLocations([squareLocation('a', `${P} Kiosk`)]);
            await syncService.sync(connection);

            expect(await findLink('b')).toMatchObject({
                squareName: `${P} Truck`,
            });
        });
    });

    describe('tenant actions', () => {
        let linkA: SquareLocationLink;
        let linkB: SquareLocationLink;

        beforeEach(async () => {
            stubLocations([
                squareLocation('a', `${P} Kiosk`),
                squareLocation('b', `${P} Truck`),
            ]);
            await syncService.sync(connection);
            linkA = await findLink('a');
            linkB = await findLink('b');
        });

        it("lists only the caller tenant's links", async () => {
            const links = await linkService.findAllForCurrentTenant();
            expect(links.map((link) => link.id).sort()).toEqual(
                [linkA.id, linkB.id].sort(),
            );

            requestContext.setContext({ tenantId: otherTenant.id });
            expect(await linkService.findAllForCurrentTenant()).toEqual([]);
        });

        it('maps two Square locations to the same Petsi location', async () => {
            await linkService.setLocationForCurrentTenant(
                linkA.id,
                downtown.id,
            );
            await linkService.setLocationForCurrentTenant(
                linkB.id,
                downtown.id,
            );

            expect((await findLink('a')).locationId).toBe(downtown.id);
            expect((await findLink('b')).locationId).toBe(downtown.id);
        });

        it("rejects mapping to another tenant's location", async () => {
            await expect(
                linkService.setLocationForCurrentTenant(
                    linkA.id,
                    foreignLocation.id,
                ),
            ).rejects.toBeInstanceOf(ValidationException);
            expect((await findLink('a')).locationId).toBeNull();
        });

        it("404s on another tenant's link", async () => {
            requestContext.setContext({ tenantId: otherTenant.id });
            await expect(
                linkService.setEnabledForCurrentTenant(linkA.id, false),
            ).rejects.toBeInstanceOf(NotFoundException);
        });

        it('rejects enabling an unmapped link with a validation error', async () => {
            const importSpy = jest.spyOn(importService, 'importLocation');
            try {
                const err: unknown = await linkService
                    .setEnabledForCurrentTenant(linkA.id, true)
                    .catch((e: unknown) => e);
                expect(err).toBeInstanceOf(ValidationException);
                expect((err as ValidationException).errors).toMatchObject({
                    errorPayload: [
                        {
                            errorCode: 'MISSING_PROPERTY',
                            fields: ['locationId'],
                        },
                    ],
                });
                expect((await findLink('a')).enabled).toBe(false);
                expect(importSpy).not.toHaveBeenCalled();
            } finally {
                importSpy.mockRestore();
            }
        });

        it('enables a mapped link and runs the import hook once', async () => {
            const importSpy = jest.spyOn(importService, 'importLocation');
            try {
                await linkService.setLocationForCurrentTenant(
                    linkA.id,
                    downtown.id,
                );
                const enabled = await linkService.setEnabledForCurrentTenant(
                    linkA.id,
                    true,
                );
                expect(enabled.enabled).toBe(true);
                // Already enabled: no second import
                await linkService.setEnabledForCurrentTenant(linkA.id, true);
                expect(importSpy).toHaveBeenCalledTimes(1);
                expect(importSpy).toHaveBeenCalledWith(
                    expect.objectContaining({ id: linkA.id, enabled: true }),
                );

                await linkService.setEnabledForCurrentTenant(linkA.id, false);
                expect((await findLink('a')).enabled).toBe(false);
                expect(importSpy).toHaveBeenCalledTimes(1);
            } finally {
                importSpy.mockRestore();
            }
        });

        it('unmapping an enabled link also disables it', async () => {
            await linkService.setLocationForCurrentTenant(
                linkA.id,
                downtown.id,
            );
            await linkService.setEnabledForCurrentTenant(linkA.id, true);

            const unmapped = await linkService.setLocationForCurrentTenant(
                linkA.id,
                null,
            );
            expect(unmapped).toMatchObject({
                locationId: null,
                enabled: false,
            });
        });

        it('creates a Petsi location named after the Square location and maps the link', async () => {
            const result = await linkService.createLocationForCurrentTenant(
                linkB.id,
            );
            expect(result.locationId).not.toBeNull();
            const created = await locationRepo.findOneByOrFail({
                id: result.locationId!,
            });
            expect(created).toMatchObject({
                tenantId: tenant.id,
                name: `${P} Truck`,
            });
            expect((await findLink('b')).locationId).toBe(created.id);
        });

        it('unmaps a link when its Petsi location is deleted', async () => {
            const result = await linkService.createLocationForCurrentTenant(
                linkB.id,
            );
            await locationRepo.delete(result.locationId!);
            expect((await findLink('b')).locationId).toBeNull();
        });
    });
});
