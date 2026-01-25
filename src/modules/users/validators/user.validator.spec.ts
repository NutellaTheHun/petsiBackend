import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { User } from '../entities/user.entities';
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
  it('successfully validate create: no validation errors', async () => {});

  it('fail validate create: name already exists', async () => {});

  // Update Validation Tests
  it('successfully validate update: no validation errors', async () => {});

  it('fail validate update: name already exists', async () => {});
});
