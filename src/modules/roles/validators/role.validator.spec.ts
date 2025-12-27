import { TestingModule } from '@nestjs/testing';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RoleService } from '../services/role.service';
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF } from '../utils/constants';
import { RoleTestUtil } from '../utils/role-test.util';
import { getRoleTestingModule } from '../utils/role-testing-module';
import { RoleValidator } from './role.validator';

describe('role validator', () => {
  let testingUtil: RoleTestUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: RoleValidator;
  let service: RoleService;

  beforeAll(async () => {
    const module: TestingModule = await getRoleTestingModule();
    validator = module.get<RoleValidator>(RoleValidator);
    service = module.get<RoleService>(RoleService);

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<RoleTestUtil>(RoleTestUtil);
    await testingUtil.initRoleTestingDatabase(dbTestContext);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  it('should validate create', async () => {
    const dto = {
      name: 'TEST NAME',
    } as CreateRoleDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should fail create: name already exists', async () => {
    const dto = {
      name: ROLE_MANAGER,
    } as CreateRoleDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('roleName');
  });

  it('should pass update', async () => {
    const toUpdate = await service.findOneByName(ROLE_ADMIN);
    if (!toUpdate) {
      throw new Error();
    }

    const dto = {
      name: 'UPDATE TEST',
    } as UpdateRoleDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeNull();
  });

  it('should fail update: name already exists', async () => {
    const toUpdate = await service.findOneByName(ROLE_ADMIN);
    if (!toUpdate) {
      throw new Error();
    }

    const dto = {
      name: ROLE_STAFF,
    } as UpdateRoleDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('roleName');
  });
});
