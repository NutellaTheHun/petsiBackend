import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { Role } from '../entities/role.entity';
import { RoleTestUtil } from '../utils/role-test.util';
import { getRoleTestingModule } from '../utils/role-testing-module';
import { RoleValidator } from './role.validator';

describe('role validator', () => {
  let testingUtil: RoleTestUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: RoleValidator;
  let roleRepo: Repository<Role>;

  beforeAll(async () => {
    const module: TestingModule = await getRoleTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<RoleTestUtil>(RoleTestUtil);
    await testingUtil.initRoleTestingDatabase(dbTestContext);

    validator = module.get<RoleValidator>(RoleValidator);

    roleRepo = module.get(getRepositoryToken(Role));
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
