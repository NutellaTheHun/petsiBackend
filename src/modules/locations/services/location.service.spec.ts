import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { Location } from '../entities/location.entity';
import { locationToUpdateDto } from '../utils/entity-transformers/location.dto.transformer';
import { LocationTestUtil } from '../utils/location-test.util';
import { getLocationsTestingModule } from '../utils/locations-testing.module';
import { LocationService } from './location.service';

class TestableLocationService extends LocationService {
    async createEntityForTest(
        dto: CreateLocationDto,
        manager: EntityManager,
    ): Promise<Location> {
        return this.createEntity(dto, manager);
    }

    async updateEntityForTest(
        dto: UpdateLocationDto,
        entity: Location,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('Location Service', () => {
    let locationTestUtil: LocationTestUtil;
    let locationService: TestableLocationService;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;
    let locationRepo: Repository<Location>;
    let tenantRepo: Repository<Tenant>;

    let tenant: Tenant;
    let locations: Location[];
    let otherTenant: Tenant;
    let otherTenantLocations: Location[];

    beforeAll(async () => {
        const module: TestingModule = await getLocationsTestingModule({
            locationServiceClass: TestableLocationService,
        });
        locationTestUtil = module.get<LocationTestUtil>(LocationTestUtil);
        locationService = module.get(LocationService) as TestableLocationService;
        dataSource = module.get(DataSource);
        locationRepo = module.get(getRepositoryToken(Location));
        tenantRepo = module.get(getRepositoryToken(Tenant));

        ({ tenant, locations } = await locationTestUtil.seedLocations(P));
        ({ tenant: otherTenant, locations: otherTenantLocations } =
            await locationTestUtil.seedLocations(`${P}-other`, undefined, 1));
        (module.get(RequestContextService) as TestRequestContextService).setContext({ tenantId: tenant.id });
    });

    afterAll(async () => {
        await locationRepo.delete([...locations, ...otherTenantLocations].map((l) => l.id));
        await tenantRepo.delete([tenant.id, otherTenant.id]);
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    describe('location lifecycle', () => {
        let location: Location;

        it('should create location', async () => {
            const dto = plainToInstance(CreateLocationDto, {
                name: `${P}-location-create`,
            });
            await dataSource.transaction(async (manager) => {
                location = await locationService.createEntityForTest(dto, manager);
            });
            expect(location.id).toBeDefined();
            expect(location.name).toEqual(dto.name);
        });

        it('should update location', async () => {
            const dto = plainToInstance(UpdateLocationDto, {
                name: `${P}-location-updated`,
            });
            await dataSource.transaction(async (manager) => {
                await locationService.updateEntityForTest(dto, location, manager);
            });
            const result = await locationRepo.findOneOrFail({ where: { id: location.id } });
            expect(result.name).toEqual(dto.name);
        });

        it('should remove location', async () => {
            const deleteResult = await locationService.remove(location.id);
            expect(deleteResult).toBe(true);
            await expect(locationService.findOne(location.id)).rejects.toThrow(NotFoundException);
        });
    });

    it('should find seeded location in findAll results', async () => {
        const result = await locationService.findAll();
        const found = result.items.find((l) => l.id === locations[0].id);
        expect(found).toBeDefined();
    });

    it('should find one location with relations', async () => {
        const result = await locationService.findOne(locations[0].id, ['tenant']);
        expect(result.id).toEqual(locations[0].id);
        expect(result.tenant.id).toEqual(tenant.id);
    });

    describe('tenant scoping', () => {
        it("findAll excludes another tenant's locations", async () => {
            const result = await locationService.findAll({ limit: 1000 });
            const ids = result.items.map((l) => l.id);
            expect(ids).toEqual(expect.arrayContaining(locations.map((l) => l.id)));
            expect(ids).not.toContain(otherTenantLocations[0].id);
        });

        it("findOne throws NotFoundException for another tenant's location", async () => {
            await expect(locationService.findOne(otherTenantLocations[0].id)).rejects.toThrow(
                NotFoundException,
            );
        });

        it("createEntity stamps the caller's tenant", async () => {
            const dto = plainToInstance(CreateLocationDto, { name: `${P}-location-stamped` });
            let created!: Location;
            await dataSource.transaction(async (manager) => {
                created = await locationService.createEntityForTest(dto, manager);
            });
            testCtx.addCleanupFunction(async () => { await locationRepo.delete(created.id); });
            expect(created.tenantId).toBe(tenant.id);
        });
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(locationService.findOne(9_999_999)).rejects.toThrow(NotFoundException);
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(LocationService.prototype as any, 'updateEntity');
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when nothing changed', async () => {
            const location = await locationService.findOne(locations[0].id, ['tenant']);
            const dto = locationToUpdateDto(location);
            await locationService.update(location.id, dto);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const location = await locationService.findOne(locations[1].id, ['tenant']);
            const dto = locationToUpdateDto(location, { name: `${P}-location-renamed` });
            await locationService.update(location.id, dto);
            expect(spy).toHaveBeenCalled();
            const row = await locationRepo.findOneOrFail({ where: { id: location.id } });
            expect(row.name).toEqual(`${P}-location-renamed`);
        });
    });
});
