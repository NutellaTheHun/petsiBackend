import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Role } from '../entities/role.entity';
import { ROLE_ADMIN } from '../utils/constants';
import { RoleTestUtil } from '../utils/role-test.util';
import { getRoleTestingModule } from '../utils/role-testing-module';
import { RoleService } from './role.service';

class TestableRoleService extends RoleService {
  async createEntityForTest(
    dto: CreateRoleDto,
    manager: EntityManager,
  ): Promise<Role> {
    return this.createEntity(dto, manager);
  }

  async updateEntityForTest(
    dto: UpdateRoleDto,
    entity: Role,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('Role Service', () => {
  let roleService: RoleService;
  let roleTestingUtil: RoleTestUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module: TestingModule = await getRoleTestingModule({
      roleServiceClass: TestableRoleService,
    });
    roleService = module.get(RoleService) as TestableRoleService;
    dataSource = module.get(DataSource);
    dbTestContext = new DatabaseTestContext();
    roleTestingUtil = module.get<RoleTestUtil>(RoleTestUtil);
    await roleTestingUtil.initRoleTestingDatabase(dbTestContext);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(roleService).toBeDefined();
  });

  it('should create a role', async () => {
    const dto = {
      name: testRoleName,
    } as CreateRoleDto;
    const result = await roleService.create(dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual(testRoleName);

    testId = result?.id as number;
  });

  it('should update a role', async () => {
    const dto = {
      name: testRoleUpdateName,
    } as UpdateRoleDto;

    const result = await roleService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual(testRoleUpdateName);
  });

  it('should remove a role', async () => {
    const removal = await roleService.remove(testId);
    expect(removal).toBeTruthy();

    await expect(roleService.findOne(testId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should retrieve all roles', async () => {
    const expected = await roleTestingUtil.getTestRoleEntities(dbTestContext);

    const results = await roleService.findAll();

    expect(results.items.length).toEqual(expected.length);

    testIds = [results.items[0].id, results.items[1].id];
  });

  it('should sort all roles', async () => {
    const expected = await roleTestingUtil.getTestRoleEntities(dbTestContext);

    const results = await roleService.findAll({ sortBy: 'roleName' });

    expect(results.items.length).toEqual(expected.length);
  });

  it('should get Roles from a list of ids', async () => {
    const results = await roleService.findEntitiesById(testIds);
    if (!results) {
      throw new Error('results is null');
    }

    expect(results.length).toEqual(testIds.length);
    for (const result of results) {
      expect(testIds.findIndex((id) => id === result.id)).not.toEqual(-1);
    }
  });

  it('should get role by name', async () => {
    const result = await roleService.findOneByName(ROLE_ADMIN);
    expect(result).not.toBeNull();
    expect(result?.name).toBe(ROLE_ADMIN);
  });
});
