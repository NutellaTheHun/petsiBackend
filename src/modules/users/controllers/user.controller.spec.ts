import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { DatabaseException } from '../../../common/exceptions/database-exception';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { Role } from '../../roles/entities/role.entity';
import { RoleTestUtil } from '../../roles/utils/role-test.util';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entities';
import { UserService } from '../services/user.service';
import { USER_A, USER_C, USER_D } from '../utils/constants';
import { getUserTestingModule } from '../utils/user-testing-module';
import { UserTestUtil } from '../utils/user-test.util';
import { UserController } from './user.controller';

describe('UserController', () => {
    let module: TestingModule;
    let dbTestContext: DatabaseTestContext;
    let userTestUtil: UserTestUtil;
    let roleTestUtil: RoleTestUtil;
    let controller: UserController;
    let userRepo: Repository<User>;
    let roleRepo: Repository<Role>;

    beforeAll(async () => {
        module = await getUserTestingModule();
        dbTestContext = new DatabaseTestContext();
        userTestUtil = module.get(UserTestUtil);
        roleTestUtil = module.get(RoleTestUtil);
        await userTestUtil.initUserTestingDatabase(dbTestContext);
        await roleTestUtil.initRoleTestingDatabase(dbTestContext);

        controller = module.get(UserController);
        userRepo = module.get(getRepositoryToken(User));
        roleRepo = module.get(getRepositoryToken(Role));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns items aligned with repository', async () => {
        const repoRows = await userRepo.find();
        const result = await controller.findAll(undefined, 100);
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with search returns users whose name matches', async () => {
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            'user',
        );
        expect(result.items.length).toBeGreaterThan(0);
        expect(
            result.items.every((u) =>
                u.name.toLowerCase().includes('user'),
            ),
        ).toBe(true);
    });

    it('findAll with role filter matches repository join count', async () => {
        const [role] = await roleRepo.find({ take: 1 });
        if (!role) throw new Error('role not found');
        const repoResult = await userRepo
            .createQueryBuilder('u')
            .leftJoin('u.roles', 'r')
            .where('r.id = :id', { id: role.id })
            .getMany();
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            undefined,
            [`role=${role.id}`],
        );
        expect(result.items.length).toEqual(repoResult.length);
    });

    it('findAll with sortBy name DESC matches repository ordering', async () => {
        const repoResult = await userRepo.find({ order: { name: 'DESC' } });
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            'name',
            'DESC',
        );
        expect(result.items.length).toEqual(repoResult.length);
        if (repoResult.length > 0) {
            expect(result.items[0].name).toEqual(repoResult[0].name);
        }
    });

    it('findOne returns a seeded user', async () => {
        const row = await userRepo.findOne({ where: { name: USER_A } });
        if (!row) throw new Error('seed user not found');
        const result = await controller.findOne(row.id);
        expect(result.id).toEqual(row.id);
        expect(result.name).toEqual(USER_A);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('create persists a user and does not return password', async () => {
        const [role] = await roleRepo.find({ take: 1 });
        if (!role) throw new Error('role not found');
        const dto = plainToInstance(CreateUserDto, {
            name: 'controller_user_create',
            password: 'secretCtrl123',
            email: 'ctrl_create@example.com',
            roleIds: [role.id],
        });
        const result = await controller.create(dto);
        expect(result.id).toBeDefined();
        expect((result as any).password).toBeUndefined();
        const persisted = await userRepo.findOne({
            where: { name: 'controller_user_create' },
        });
        expect(persisted).not.toBeNull();
    });

    it('create throws ValidationException when name already exists', async () => {
        const [role] = await roleRepo.find({ take: 1 });
        if (!role) throw new Error('role not found');
        const dto = plainToInstance(CreateUserDto, {
            name: USER_A,
            password: 'x',
            email: null,
            roleIds: [role.id],
        });
        try {
            await controller.create(dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorSize(err.errors, 1);
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('ALREADY_EXISTS', undefined, [
                    'name',
                ]),
            );
        }
    });

    it('update throws ValidationException when name collides with another user', async () => {
        const users = await userRepo.find({ relations: ['roles'] });
        if (users.length < 2) throw new Error('not enough users');
        const u0 = users[0];
        const u1 = users[1];
        const dto = plainToInstance(UpdateUserDto, {
            name: u1.name,
            email: u0.email ?? null,
            roleIds: u0.roles.map((r) => r.id),
        });
        try {
            await controller.update(u0.id, dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorSize(err.errors, 1);
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('ALREADY_EXISTS', undefined, [
                    'name',
                ]),
            );
        }
    });

    it('update surfaces missing entity via DatabaseException', async () => {
        const [role] = await roleRepo.find({ take: 1 });
        if (!role) throw new Error('role not found');
        const dto = plainToInstance(UpdateUserDto, {
            name: 'ghost',
            email: null,
            roleIds: [role.id],
        });
        await expect(controller.update(9_999_999, dto)).rejects.toThrow(
            DatabaseException,
        );
    });

    describe('change detector on update', () => {
        let updateEntitySpy: jest.SpyInstance;

        beforeEach(() => {
            updateEntitySpy = jest.spyOn(
                UserService.prototype as any,
                'updateEntity',
            );
        });

        afterEach(() => {
            updateEntitySpy.mockRestore();
        });

        it('skips updateEntity when DTO matches current user', async () => {
            const user = await userRepo.findOne({
                where: { name: USER_C },
                relations: ['roles'],
            });
            if (!user?.roles?.length) throw new Error('user_c not found');
            const dto = plainToInstance(UpdateUserDto, {
                name: user.name,
                email: user.email ?? null,
                roleIds: user.roles.map((r) => r.id),
            });
            const result = await controller.update(user.id, dto);
            expect(result.name).toEqual(user.name);
            expect(updateEntitySpy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const user = await userRepo.findOne({
                where: { name: USER_D },
                relations: ['roles'],
            });
            if (!user?.roles?.length) throw new Error('user_d not found');
            const newName = 'user_d_ctrl_renamed';
            const dto = plainToInstance(UpdateUserDto, {
                name: newName,
                email: user.email ?? null,
                roleIds: user.roles.map((r) => r.id),
            });
            const result = await controller.update(user.id, dto);
            expect(result.name).toEqual(newName);
            expect(updateEntitySpy).toHaveBeenCalled();
            const row = await userRepo.findOne({ where: { id: user.id } });
            expect(row!.name).toEqual(newName);
        });
    });

    it('remove deletes a created user then findOne fails', async () => {
        const [role] = await roleRepo.find({ take: 1 });
        if (!role) throw new Error('role not found');
        const created = await controller.create(
            plainToInstance(CreateUserDto, {
                name: 'controller_user_remove',
                password: 'rm123456',
                email: 'ctrl_rm@example.com',
                roleIds: [role.id],
            }),
        );
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('remove throws NotFoundException when id does not exist', async () => {
        await expect(controller.remove(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });
});
