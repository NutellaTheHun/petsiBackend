import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entities';
import { USER_A } from '../utils/constants';
import { UserTestUtil } from '../utils/user-test.util';
import { getUserTestingModule } from '../utils/user-testing-module';
import { UserValidator } from './user.validator';

describe('user validator', () => {
    let testingUtil: UserTestUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: UserValidator;
    let userRepo: Repository<User>;

    beforeAll(async () => {
        const module: TestingModule = await getUserTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<UserTestUtil>(UserTestUtil);
        await testingUtil.initUserTestingDatabase(dbTestContext);

        validator = module.get<UserValidator>(UserValidator);

        userRepo = module.get(getRepositoryToken(User));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined;
    });

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const dto: CreateUserDto = {
            name: 'New User Name',
            password: 'password123',
        };

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateUserDto = {
            name: USER_A,
            password: 'password123',
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const userToUpdate = await userRepo.findOne({ where: { name: USER_A } });
        if (!userToUpdate) {
            throw new Error('user not found');
        }

        const dto: UpdateUserDto = {
            name: 'Updated User Name',
            email: userToUpdate.email ?? undefined,
            roleIds: userToUpdate.roles.map(role => role.id),
        };

        const errors = await validator.validateDto(dto, userToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const users = await userRepo.find();
        if (users.length < 2) {
            throw new Error('Not enough users for test');
        }

        const userToUpdate = users[0];
        const existingUser = users[1];

        const dto: UpdateUserDto = {
            name: existingUser.name,
            roleIds: userToUpdate.roles.map(role => role.id),
            email: userToUpdate.email ?? undefined,
        };

        const errors = await validator.validateDto(dto, userToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });
});
