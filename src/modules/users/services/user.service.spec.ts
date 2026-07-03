import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { Role } from '../../roles/entities/role.entity';
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
    let roleRepo: Repository<Role>;

    let roles: Role[];
    let users: User[];

    beforeAll(async () => {
        const module: TestingModule = await getUserTestingModule({
            userServiceClass: TestableUserService,
        });
        dataSource = module.get(DataSource);
        usersService = module.get(UserService) as TestableUserService;
        userTestingUtil = module.get<UserTestUtil>(UserTestUtil);
        userRepo = module.get(getRepositoryToken(User));
        roleRepo = module.get(getRepositoryToken(Role));

        ({ roles, users } = await userTestingUtil.seedUsers(P));
    });

    afterAll(async () => {
        await userRepo.delete(users.map((u) => u.id));
        await roleRepo.delete(roles.map((r) => r.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
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
                roleIds: [roles[0].id],
            });

            await dataSource.transaction(async (manager) => {
                user = await usersService.createEntityForTest(dto, manager);
            });
            expect(user.id).toBeDefined();
            expect(user.email).toEqual(dto.email);
            expect((user as any).password).toBeUndefined();
        });

        it('should update user', async () => {
            const loaded = await userRepo.findOneOrFail({
                where: { id: user.id },
                relations: ['roles'],
            });
            const dto = plainToInstance(UpdateUserDto, {
                name: `${P}-user-updated`,
                email: `${P}-user-updated@example.com`,
                roleIds: [roles[0].id],
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

    it('should find seeded users filtered by role', async () => {
        const role = roles[0];
        const result = await usersService.findAll({
            filters: [`role=${role.id}`],
            limit: 100,
        });
        const found = result.items.find((u) => u.id === users[0].id);
        expect(found).toBeDefined();
    });

    it('should find one user with relations', async () => {
        const result = await usersService.findOne(users[0].id, ['roles']);
        expect(result.id).toEqual(users[0].id);
        expect(Array.isArray(result.roles)).toBe(true);
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
            const user = await userRepo.findOneOrFail({
                where: { id: users[2].id },
                relations: ['roles'],
            });
            const dto = userToUpdateDto(user, { password: undefined });
            const result = await usersService.update(user.id, dto);
            expect(result.name).toEqual(user.name);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const user = await userRepo.findOneOrFail({
                where: { id: users[3].id },
                relations: ['roles'],
            });
            const newName = `${P}-user-renamed`;
            const dto = userToUpdateDto(user, { name: newName, password: undefined });
            await usersService.update(user.id, dto);
            expect(spy).toHaveBeenCalled();
            const row = await userRepo.findOneOrFail({ where: { id: user.id } });
            expect(row.name).toEqual(newName);
        });
    });
});
