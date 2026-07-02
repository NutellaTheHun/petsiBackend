import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { Role } from '../../roles/entities/role.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entities';
import { UserTestUtil } from '../utils/user-test.util';
import { getUserTestingModule } from '../utils/user-testing-module';
import { UserController } from './user.controller';

const P = `t${Date.now()}`;

describe('UserController', () => {
    let testingUtil: UserTestUtil;
    let testCtx: DatabaseTestContext;
    let controller: UserController;
    let userRepo: Repository<User>;
    let roleRepo: Repository<Role>;

    let roles: Role[];
    let users: User[];

    beforeAll(async () => {
        const module: TestingModule = await getUserTestingModule();
        testingUtil = module.get<UserTestUtil>(UserTestUtil);
        controller = module.get(UserController);
        userRepo = module.get(getRepositoryToken(User));
        roleRepo = module.get(getRepositoryToken(Role));

        ({ roles, users } = await testingUtil.seedUsers(P));
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

    it('create throws ValidationException when name already exists', async () => {
        const dto = plainToInstance(CreateUserDto, {
            name: users[0].name,
            password: 'x',
            email: null,
            roleIds: [roles[0].id],
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

    it('remove deletes a created user then findOne fails', async () => {
        const created = await controller.create(
            plainToInstance(CreateUserDto, {
                name: `${P}-controller-user-remove`,
                password: 'rm123456',
                email: `${P}-ctrl-rm@example.com`,
                roleIds: [roles[0].id],
            }),
        );
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(
            NotFoundException,
        );
    });
});
