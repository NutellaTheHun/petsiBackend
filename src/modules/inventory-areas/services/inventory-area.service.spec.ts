import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { Location } from '../../locations/entities/location.entity';
import { LocationTestUtil } from '../../locations/utils/location-test.util';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CreateInventoryAreaDto } from '../dto/inventory-area/create-inventory-area.dto';
import { UpdateInventoryAreaDto } from '../dto/inventory-area/update-inventory-area.dto';
import { InventoryArea } from '../entities/inventory-area.entity';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaService } from './inventory-area.service';

class TestableInventoryAreaService extends InventoryAreaService {
    async createEntityForTest(
        dto: CreateInventoryAreaDto,
        manager: EntityManager,
    ) {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateInventoryAreaDto,
        entity: InventoryArea,
        manager: EntityManager,
    ) {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('Inventory area service', () => {
    let testingUtil: InventoryAreaTestUtil;
    let locationTestUtil: LocationTestUtil;
    let service: TestableInventoryAreaService;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;
    let areaRepo: Repository<InventoryArea>;
    let tenantRepo: Repository<Tenant>;
    let requestContext: TestRequestContextService;

    let tenant: Tenant;
    let locationA: Location;
    let locationB: Location;
    let otherTenant: Tenant;
    let otherTenantLocation: Location;

    let areas: InventoryArea[];
    let otherLocationArea: InventoryArea;
    let otherTenantArea: InventoryArea;

    const setNormalContext = () =>
        requestContext.setContext({
            tenantId: tenant.id,
            isTenantAdmin: false,
            locations: [{ locationId: locationA.id, roles: ['staff'] }],
        });

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule({
            areaServiceClass: TestableInventoryAreaService,
        });
        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
        locationTestUtil = module.get<LocationTestUtil>(LocationTestUtil);
        service = module.get(InventoryAreaService) as TestableInventoryAreaService;
        dataSource = module.get(DataSource);
        areaRepo = module.get(getRepositoryToken(InventoryArea));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        requestContext = module.get(RequestContextService) as TestRequestContextService;

        ({ tenant, locations: [locationA, locationB] } =
            await locationTestUtil.seedLocations(P, undefined, 2));
        ({ tenant: otherTenant, locations: [otherTenantLocation] } =
            await locationTestUtil.seedLocations(`${P}-other`, undefined, 1));

        setNormalContext();

        ({ areas } = await testingUtil.seedAreas(P, tenant.id, locationA.id));
        otherLocationArea = await areaRepo.save({
            name: `${P}-other-location-area`,
            tenantId: tenant.id,
            locationId: locationB.id,
        } as InventoryArea);
        otherTenantArea = await areaRepo.save({
            name: `${P}-other-tenant-area`,
            tenantId: otherTenant.id,
            locationId: otherTenantLocation.id,
        } as InventoryArea);
    });

    afterAll(async () => {
        await areaRepo.delete([
            ...areas.map((a) => a.id),
            otherLocationArea.id,
            otherTenantArea.id,
        ]);
        await tenantRepo.delete([tenant.id, otherTenant.id]);
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
        setNormalContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    describe('area lifecycle', () => {
        let area: InventoryArea;

        it('should create area', async () => {
            const dto = plainToInstance(CreateInventoryAreaDto, {
                name: `${P}-lifecycle-area`,
                locationId: locationA.id,
            });
            await dataSource.transaction(async (manager) => {
                area = await service.createEntityForTest(dto, manager);
            });
            expect(area.id).toBeDefined();
            expect(area.name).toBe(dto.name);
            expect(area.tenantId).toBe(tenant.id);
        });

        it('should update area', async () => {
            const dto = plainToInstance(UpdateInventoryAreaDto, {
                name: `${P}-lifecycle-area-updated`,
                locationId: locationA.id,
            });
            await dataSource.transaction(async (manager) => {
                await service.updateEntityForTest(dto, area, manager);
            });
            const reloaded = await areaRepo.findOneOrFail({ where: { id: area.id } });
            expect(reloaded.name).toBe(`${P}-lifecycle-area-updated`);
        });

        it('should remove area', async () => {
            await service.remove(area.id);
            await expect(service.findOne(area.id)).rejects.toThrow(NotFoundException);
        });
    });

    it('should find seeded area in findAll results', async () => {
        const result = await service.findAll({ limit: 100 });
        const found = result.items.find((a) => a.id === areas[0].id);
        expect(found).toBeDefined();
    });

    it('should find one area with relations', async () => {
        const result = await service.findOne(areas[0].id, ['inventoryCounts']);
        expect(result.id).toBe(areas[0].id);
        expect(Array.isArray(result.inventoryCounts)).toBe(true);
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(service.findOne(9_999_999)).rejects.toThrow(NotFoundException);
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(InventoryAreaService.prototype as any, 'updateEntity');
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when DTO matches entity', async () => {
            const area = await areaRepo.findOneOrFail({ where: { id: areas[1].id } });
            const dto = plainToInstance(UpdateInventoryAreaDto, {
                name: area.name,
                locationId: area.locationId,
            });
            const result = await service.update(area.id, dto);
            expect(result.name).toBe(area.name);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const area = await areaRepo.findOneOrFail({ where: { id: areas[2].id } });
            const dto = plainToInstance(UpdateInventoryAreaDto, {
                name: `${P}-area-renamed`,
                locationId: area.locationId,
            });
            await service.update(area.id, dto);
            expect(spy).toHaveBeenCalled();
            const row = await areaRepo.findOneOrFail({ where: { id: area.id } });
            expect(row.name).toBe(`${P}-area-renamed`);
        });
    });

    describe('tenant/location scoping', () => {
        it('create stamps the caller tenant, not client input', async () => {
            const created = (await service.create(
                plainToInstance(CreateInventoryAreaDto, {
                    name: `${P}-tenant-stamped`,
                    locationId: locationA.id,
                }),
            )) as InventoryArea;
            expect(created.tenantId).toBe(tenant.id);
            await areaRepo.delete(created.id);
        });

        it('create throws ForbiddenException for a locationId the caller is not assigned to', async () => {
            await expect(
                service.create(
                    plainToInstance(CreateInventoryAreaDto, {
                        name: `${P}-unauthorized-create`,
                        locationId: locationB.id,
                    }),
                ),
            ).rejects.toThrow(ForbiddenException);
        });

        it('findOne throws NotFoundException for an id belonging to a different tenant', async () => {
            await expect(service.findOne(otherTenantArea.id)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('findOne throws NotFoundException for an id at a location the caller is not assigned to', async () => {
            await expect(service.findOne(otherLocationArea.id)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('findAll excludes another tenant\'s areas', async () => {
            const result = await service.findAll({ limit: 100 });
            expect(result.items.find((a) => a.id === otherTenantArea.id)).toBeUndefined();
        });

        it('findAll excludes areas at locations the caller is not assigned to', async () => {
            const result = await service.findAll({ limit: 100 });
            expect(result.items.find((a) => a.id === otherLocationArea.id)).toBeUndefined();
        });

        it('findAll with an unauthorized locationId filter throws ForbiddenException', async () => {
            await expect(
                service.findAll({ limit: 100, locationId: locationB.id }),
            ).rejects.toThrow(ForbiddenException);
        });

        it('findAll with an authorized locationId filter returns only that location\'s areas', async () => {
            const result = await service.findAll({ limit: 100, locationId: locationA.id });
            expect(result.items.find((a) => a.id === areas[0].id)).toBeDefined();
            expect(result.items.every((a) => a.locationId === locationA.id)).toBe(true);
        });

        it('remove throws NotFoundException for an id belonging to a different tenant', async () => {
            await expect(service.remove(otherTenantArea.id)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('remove throws NotFoundException for an id at an unauthorized location', async () => {
            await expect(service.remove(otherLocationArea.id)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('isTenantAdmin bypasses location authorization within the same tenant', async () => {
            requestContext.setContext({
                tenantId: tenant.id,
                isTenantAdmin: true,
                locations: [],
            });

            const result = await service.findOne(otherLocationArea.id);
            expect(result.id).toBe(otherLocationArea.id);

            const findAllResult = await service.findAll({ limit: 100 });
            expect(
                findAllResult.items.find((a) => a.id === otherLocationArea.id),
            ).toBeDefined();
            expect(
                findAllResult.items.find((a) => a.id === otherTenantArea.id),
            ).toBeUndefined();
        });
    });
});
