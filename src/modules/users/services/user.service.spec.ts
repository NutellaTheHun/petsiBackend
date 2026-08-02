import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entities';
import { userToUpdateDto } from '../utils/entity-transformers/user.dto.transformer';
import { UserTestUtil } from '../utils/user-test.util';
import { getUserTestingModule } from '../utils/user-testing-module';
import { UserService } from './user.service';

class TestableUserService extends UserService {
    async createEntityForTest(
        dto: CreateUserDto,
        manager: EntityManager,
    ): Promise<User> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateUserDto,
        entity: User,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('User Service', () => {
    let userTestingUtil: UserTestUtil;
    let usersService: TestableUserService;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;
    let userRepo: Repository<User>;
    let tenantRepo: Repository<Tenant>;
    let requestContext: TestRequestContextService;

    let tenant: Tenant;
    let otherTenant: Tenant;
    let users: User[];
    let otherTenantUser: User;

    beforeAll(async () => {
        const module: TestingModule = await getUserTestingModule({
            userServiceClass: TestableUserService,
        });
        dataSource = module.get(DataSource);
        usersService = module.get(UserService) as TestableUserService;
        userTestingUtil = module.get<UserTestUtil>(UserTestUtil);
        userRepo = module.get(getRepositoryToken(User));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        requestContext = module.get(RequestContextService) as TestRequestContextService;

        tenant = await tenantRepo.save({ name: `${P}-tenant`, subdomain: `${P}-subdomain` });
        otherTenant = await tenantRepo.save({
            name: `${P}-other-tenant`,
            subdomain: `${P}-other-subdomain`,
        });
        requestContext.setContext({ tenantId: tenant.id });

        ({ users } = await userTestingUtil.seedUsers(P, tenant.id));
        otherTenantUser = (
            await userTestingUtil.seedUsers(`${P}-other`, otherTenant.id)
        ).users[0];
    });

    afterAll(async () => {
        await userRepo.delete([...users.map((u) => u.id), otherTenantUser.id]);
        await tenantRepo.delete([tenant.id, otherTenant.id]);
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
        requestContext.setContext({ tenantId: tenant.id });
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    describe('user lifecycle', () => {
        let user: User;

        it('should create user and not return password property', async () => {
            const dto = plainToInstance(CreateUserDto, {
                name: `${P}-user-create`,
                password: 'secret123',
                email: `${P}-user-create@example.com`,
            });

            await dataSource.transaction(async (manager) => {
                user = await usersService.createEntityForTest(dto, manager);
            });
            expect(user.id).toBeDefined();
            expect(user.email).toEqual(dto.email);
            expect(user.tenantId).toEqual(tenant.id);
            expect((user as any).password).toBeUndefined();
        });

        it('should update user', async () => {
            const loaded = await userRepo.findOneOrFail({ where: { id: user.id } });
            const dto = plainToInstance(UpdateUserDto, {
                name: `${P}-user-updated`,
                email: `${P}-user-updated@example.com`,
            });

            await dataSource.transaction(async (manager) => {
                await usersService.updateEntityForTest(dto, loaded, manager);
            });

            const result = await userRepo.findOneOrFail({ where: { id: user.id } });
            expect(result.name).toEqual(dto.name);
            expect(result.email).toEqual(dto.email);
        });

        it('should remove user', async () => {
            const deleteResult = await usersService.remove(user.id);
            expect(deleteResult).toBe(true);
            await expect(usersService.findOne(user.id)).rejects.toThrow(NotFoundException);
        });
    });

    it('should find seeded user in findAll search results', async () => {
        const result = await usersService.findAll({ search: `${P}-user`, limit: 100 });
        const found = result.items.find((u) => u.id === users[0].id);
        expect(found).toBeDefined();
        expect(
            result.items.every((u) => u.name.toLowerCase().includes(P.toLowerCase())),
        ).toBe(true);
    });

    it('should find one user', async () => {
        const result = await usersService.findOne(users[0].id);
        expect(result.id).toEqual(users[0].id);
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(usersService.findOne(9_999_999)).rejects.toThrow(NotFoundException);
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(UserService.prototype as any, 'updateEntity');
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when DTO matches current user', async () => {
            const user = await userRepo.findOneOrFail({ where: { id: users[2].id } });
            const dto = userToUpdateDto(user, { password: undefined });
            const result = await usersService.update(user.id, dto);
            expect(result.name).toEqual(user.name);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const user = await userRepo.findOneOrFail({ where: { id: users[3].id } });
            const newName = `${P}-user-renamed`;
            const dto = userToUpdateDto(user, { name: newName, password: undefined });
            await usersService.update(user.id, dto);
            expect(spy).toHaveBeenCalled();
            const row = await userRepo.findOneOrFail({ where: { id: user.id } });
            expect(row.name).toEqual(newName);
        });
    });

    describe('tenant scoping', () => {
        it('create stamps the caller tenant, not client input', async () => {
            const created = await usersService.create(
                plainToInstance(CreateUserDto, {
                    name: `${P}-tenant-stamped`,
                    password: 'secret123',
                    email: `${P}-tenant-stamped@example.com`,
                }),
            );
            expect((created as User).tenantId).toBe(tenant.id);
            await userRepo.delete(created.id);
        });

        it('findOne throws NotFoundException for an id belonging to a different tenant', async () => {
            await expect(usersService.findOne(otherTenantUser.id)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('findAll excludes another tenant\'s users', async () => {
            const result = await usersService.findAll({ limit: 100 });
            expect(result.items.find((u) => u.id === otherTenantUser.id)).toBeUndefined();
        });
    });
});
