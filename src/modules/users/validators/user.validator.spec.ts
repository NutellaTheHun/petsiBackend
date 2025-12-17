import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserService } from '../services/user.service';
import { USER_A, USER_B, USER_C } from '../utils/constants';
import { UserTestUtil } from '../utils/user-test.util';
import { getUserTestingModule } from '../utils/user-testing-module';
import { UserValidator } from './user.validator';

describe('user validator', () => {
  let testingUtil: UserTestUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: UserValidator;
  let service: UserService;

  beforeAll(async () => {
    const module: TestingModule = await getUserTestingModule();
    validator = module.get<UserValidator>(UserValidator);
    service = module.get<UserService>(UserService);

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<UserTestUtil>(UserTestUtil);
    await testingUtil.initUserTestingDatabase(dbTestContext);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  it('should validate create', async () => {
    const dto = {
      name: 'testUser',
      password: 'testPass',
      email: 'email',
    } as CreateUserDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should fail create (name already exists)', async () => {
    const dto = {
      name: USER_A,
      password: 'pass',
      email: 'email',
    } as CreateUserDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('username');
  });

  it('should pass update', async () => {
    const toUpdate = await service.findOneByName(USER_B);
    if (!toUpdate) {
      throw new Error();
    }

    const dto = {
      name: 'testUser',
      password: 'testPass',
      email: 'email',
    } as UpdateUserDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeNull();
  });

  it('should fail update (name already exists)', async () => {
    const toUpdate = await service.findOneByName(USER_B);
    if (!toUpdate) {
      throw new Error();
    }

    const dto = {
      name: USER_C,
      password: 'testPass',
      email: 'email',
    } as UpdateUserDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('username');
  });
});
