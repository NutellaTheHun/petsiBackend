import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Role } from '../../roles/entities/role.entity';
import { RoleTestUtil } from '../../roles/utils/role-test.util';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entities';
import { UserTestUtil } from '../../users/utils/user-test.util';
import { CreateUserLocationDto } from '../dto/create-user-location.dto';
import { UpdateUserLocationDto } from '../dto/update-user-location.dto';
import { Location } from '../entities/location.entity';
import { UserLocation } from '../entities/user-location.entity';
import { getLocationsTestingModule } from '../utils/locations-testing.module';
import { LocationTestUtil } from '../utils/location-test.util';
import { UserLocationService } from './user-location.service';

class TestableUserLocationService extends UserLocationService {
    async createEntityForTest(
        dto: CreateUserLocationDto,
        manager: EntityManager,
    ): Promise<UserLocation> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateUserLocationDto,
        entity: UserLocation,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('user location service', () => {
    let locationTestUtil: LocationTestUtil;
    let userTestUtil: UserTestUtil;
    let roleTestUtil: RoleTestUtil;
    let service: TestableUserLocationService;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;
    let userLocationRepo: Repository<UserLocation>;
    let tenantRepo: Repository<Tenant>;
    let requestContext: TestRequestContextService;

    let tenant: Tenant;
    let locationA: Location;
    let locationB: Location;
    let otherTenant: Tenant;
    let otherTenantLocation: Location;

    let users: User[];
    let roles: Role[];

    let assignments: UserLocation[];
    let otherLocationAssignment: UserLocation;
    let otherTenantAssignment: UserLocation;

    const setNormalContext = () =>
        requestContext.setContext({
            tenantId: tenant.id,
            isTenantAdmin: false,
            locations: [{ locationId: locationA.id, roles: ['staff'] }],
        });

    beforeAll(async () => {
        const module: TestingModule = await getLocationsTestingModule({
            userLocationServiceClass: TestableUserLocationService,
        });
        locationTestUtil = module.get<LocationTestUtil>(LocationTestUtil);
        userTestUtil = module.get<UserTestUtil>(UserTestUtil);
        roleTestUtil = module.get<RoleTestUtil>(RoleTestUtil);
        service = module.get(UserLocationService) as TestableUserLocationService;
        dataSource = module.get(DataSource);
        userLocationRepo = module.get(getRepositoryToken(UserLocation));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        requestContext = module.get(RequestContextService) as TestRequestContextService;

        ({ tenant, locations: [locationA, locationB] } =
            await locationTestUtil.seedLocations(P, undefined, 2));
        ({ tenant: otherTenant, locations: [otherTenantLocation] } =
            await locationTestUtil.seedLocations(`${P}-other`, undefined, 1));

        ({ users } = await userTestUtil.seedUsers(P, tenant.id));
        ({ roles } = await roleTestUtil.seedRoles(P, tenant.id));

        setNormalContext();

        assignments = [];
        for (let i = 0; i < 3; i++) {
            assignments.push(
                await userLocationRepo.save({
                    tenantId: tenant.id,
                    locationId: locationA.id,
                    user: users[i],
                    roles: [roles[i % roles.length]],
                } as UserLocation),
            );
        }

        otherLocationAssignment = await userLocationRepo.save({
            tenantId: tenant.id,
            locationId: locationB.id,
            user: users[3],
            roles: [roles[0]],
        } as UserLocation);

        const { users: otherTenantUsers } = await userTestUtil.seedUsers(
            `${P}-other`,
            otherTenant.id,
        );
        const { roles: otherTenantRoles } = await roleTestUtil.seedRoles(
            `${P}-other`,
            otherTenant.id,
        );
        otherTenantAssignment = await userLocationRepo.save({
            tenantId: otherTenant.id,
            locationId: otherTenantLocation.id,
            user: otherTenantUsers[0],
            roles: [otherTenantRoles[0]],
        } as UserLocation);
    });

    afterAll(async () => {
        await userLocationRepo.delete([
            ...assignments.map((a) => a.id),
            otherLocationAssignment.id,
            otherTenantAssignment.id,
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

    describe('assignment lifecycle', () => {
        let assignment: UserLocation;

        it('should create assignment', async () => {
            const dto = plainToInstance(CreateUserLocationDto, {
                userId: users[4].id,
                locationId: locationA.id,
                roleIds: [roles[0].id],
            });
            await dataSource.transaction(async (manager) => {
                assignment = await service.createEntityForTest(dto, manager);
            });
            expect(assignment.id).toBeDefined();
            expect(assignment.tenantId).toBe(tenant.id);
            expect(assignment.locationId).toBe(locationA.id);
        });

        it('should update assignment roles', async () => {
            const dto = plainToInstance(UpdateUserLocationDto, {
                locationId: locationA.id,
                roleIds: [roles[1].id],
            });
            await dataSource.transaction(async (manager) => {
                await service.updateEntityForTest(dto, assignment, manager);
            });
            const reloaded = await userLocationRepo.findOneOrFail({
                where: { id: assignment.id },
                relations: ['roles'],
            });
            expect(reloaded.roles.map((r) => r.id)).toEqual([roles[1].id]);
        });

        it('should remove assignment', async () => {
            await service.remove(assignment.id);
            await expect(service.findOne(assignment.id)).rejects.toThrow(NotFoundException);
        });
    });

    it('should find seeded assignment in findAll results', async () => {
        const result = await service.findAll({ limit: 100 });
        const found = result.items.find((a) => a.id === assignments[0].id);
        expect(found).toBeDefined();
    });

    it('should find one assignment with relations', async () => {
        const result = await service.findOne(assignments[0].id, ['user', 'roles']);
        expect(result.id).toBe(assignments[0].id);
        expect(result.user.id).toBe(users[0].id);
        expect(Array.isArray(result.roles)).toBe(true);
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(service.findOne(9_999_999)).rejects.toThrow(NotFoundException);
    });

    it('findAll filtered by user returns only that user\'s assignments', async () => {
        const result = await service.findAll({
            limit: 100,
            filters: [`user=${users[0].id}`],
        });
        expect(result.items.every((a) => a.id === assignments[0].id)).toBe(true);
        expect(result.items.find((a) => a.id === assignments[0].id)).toBeDefined();
    });

    describe('a user can hold different roles at different locations', () => {
        it('reflects distinct role sets per location for the same user', async () => {
            requestContext.setContext({
                tenantId: tenant.id,
                isTenantAdmin: true,
                locations: [],
            });

            const atLocationA = await userLocationRepo.save({
                tenantId: tenant.id,
                locationId: locationA.id,
                user: users[0],
                roles: [roles[0]],
            } as UserLocation);
            const atLocationB = await userLocationRepo.save({
                tenantId: tenant.id,
                locationId: locationB.id,
                user: users[0],
                roles: [roles[1]],
            } as UserLocation);

            const result = await service.findAll({
                limit: 100,
                filters: [`user=${users[0].id}`],
            });

            const foundA = result.items.find((a) => a.id === atLocationA.id);
            const foundB = result.items.find((a) => a.id === atLocationB.id);
            expect(foundA?.locationId).toBe(locationA.id);
            expect(foundB?.locationId).toBe(locationB.id);

            const reloadedA = await userLocationRepo.findOneOrFail({
                where: { id: atLocationA.id },
                relations: ['roles'],
            });
            const reloadedB = await userLocationRepo.findOneOrFail({
                where: { id: atLocationB.id },
                relations: ['roles'],
            });
            expect(reloadedA.roles.map((r) => r.id)).toEqual([roles[0].id]);
            expect(reloadedB.roles.map((r) => r.id)).toEqual([roles[1].id]);

            await userLocationRepo.delete([atLocationA.id, atLocationB.id]);
        });
    });

    describe('tenant/location scoping', () => {
        it('create stamps the caller tenant, not client input', async () => {
            const created = (await service.create(
                plainToInstance(CreateUserLocationDto, {
                    userId: users[0].id,
                    locationId: locationA.id,
                    roleIds: [roles[0].id],
                }),
            )) as UserLocation;
            expect(created.tenantId).toBe(tenant.id);
            await userLocationRepo.delete(created.id);
        });

        it('create throws ForbiddenException for a locationId the caller is not assigned to', async () => {
            await expect(
                service.create(
                    plainToInstance(CreateUserLocationDto, {
                        userId: users[0].id,
                        locationId: locationB.id,
                        roleIds: [roles[0].id],
                    }),
                ),
            ).rejects.toThrow(ForbiddenException);
        });

        it('findOne throws NotFoundException for an id belonging to a different tenant', async () => {
            await expect(service.findOne(otherTenantAssignment.id)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('findOne throws NotFoundException for an id at a location the caller is not assigned to', async () => {
            await expect(service.findOne(otherLocationAssignment.id)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('isTenantAdmin bypasses location authorization within the same tenant', async () => {
            requestContext.setContext({
                tenantId: tenant.id,
                isTenantAdmin: true,
                locations: [],
            });

            const result = await service.findOne(otherLocationAssignment.id);
            expect(result.id).toBe(otherLocationAssignment.id);
        });
    });
});
