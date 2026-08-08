import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { RequestContextService } from '../../request-context/RequestContextService';
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
    let requestContext: TestRequestContextService;

    let validator: UserValidator;
    let userRepo: Repository<User>;

    let tenantId: number;
    let users: User[];

    beforeAll(async () => {
        const module: TestingModule = await getUserTestingModule();
        testingUtil = module.get<UserTestUtil>(UserTestUtil);
        validator = module.get<UserValidator>(UserValidator);
        userRepo = module.get(getRepositoryToken(User));
        requestContext = module.get(RequestContextService) as TestRequestContextService;

        ({ tenantId, users } = await testingUtil.seedUsers(P));
        requestContext.setContext({ tenantId });
    });

    afterAll(async () => {
        await userRepo.delete(users.map((u) => u.id));
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
        const userToUpdate = await userRepo.findOneOrFail({ where: { id: users[0].id } });

        const dto: UpdateUserDto = plainToInstance(UpdateUserDto, {
            name: `${P}-updated-user-name`,
            email: userToUpdate.email ?? null,
        });

        const errors = await validator.validateDto(dto, userToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const userToUpdate = users[0];
        const existingUser = users[1];

        const dto: UpdateUserDto = plainToInstance(UpdateUserDto, {
            name: existingUser.name,
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
