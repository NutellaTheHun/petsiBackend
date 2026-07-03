import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { Role } from '../../roles/entities/role.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entities';
import { UserTestUtil } from '../utils/user-test.util';
import { getUserTestingModule } from '../utils/user-testing-module';
import { UserValidator } from './user.validator';

const P = `t${Date.now()}`;

describe('user validator', () => {
    let testingUtil: UserTestUtil;
    let testCtx: DatabaseTestContext;

    let validator: UserValidator;
    let userRepo: Repository<User>;
    let roleRepo: Repository<Role>;

    let roles: Role[];
    let users: User[];

    beforeAll(async () => {
        const module: TestingModule = await getUserTestingModule();
        testingUtil = module.get<UserTestUtil>(UserTestUtil);
        validator = module.get<UserValidator>(UserValidator);
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

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const dto: CreateUserDto = plainToInstance(CreateUserDto, {
            name: `${P}-new-user-name`,
            password: 'password123',
            email: null,
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateUserDto = plainToInstance(CreateUserDto, {
            name: users[0].name,
            password: 'password123',
            email: null,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const userToUpdate = await userRepo.findOneOrFail({
            where: { id: users[0].id },
            relations: ['roles'],
        });

        const dto: UpdateUserDto = plainToInstance(UpdateUserDto, {
            name: `${P}-updated-user-name`,
            email: userToUpdate.email ?? null,
            roleIds: userToUpdate.roles.map((role) => role.id),
        });

        const errors = await validator.validateDto(dto, userToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const userToUpdate = await userRepo.findOneOrFail({
            where: { id: users[0].id },
            relations: ['roles'],
        });
        const existingUser = users[1];

        const dto: UpdateUserDto = plainToInstance(UpdateUserDto, {
            name: existingUser.name,
            roleIds: userToUpdate.roles.map((role) => role.id),
            email: userToUpdate.email ?? null,
        });

        const errors = await validator.validateDto(dto, userToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });
});
