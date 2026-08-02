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
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entities';
import { UserTestUtil } from '../utils/user-test.util';
import { getUserTestingModule } from '../utils/user-testing-module';
import { UserController } from './user.controller';

const P = `t${Date.now()}`;

describe('UserController', () => {
    let testingUtil: UserTestUtil;
    let testCtx: DatabaseTestContext;
    let requestContext: TestRequestContextService;
    let controller: UserController;
    let userRepo: Repository<User>;

    let tenantId: number;
    let users: User[];

    beforeAll(async () => {
        const module: TestingModule = await getUserTestingModule();
        testingUtil = module.get<UserTestUtil>(UserTestUtil);
        controller = module.get(UserController);
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

    it('create throws ValidationException when name already exists', async () => {
        const dto = plainToInstance(CreateUserDto, {
            name: users[0].name,
            password: 'x',
            email: null,
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
            }),
        );
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(
            NotFoundException,
        );
    });
});
