import { TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Role } from '../entities/role.entity';
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

  // test createEntity()
  it('should create role', async () => {});

  // test updateEntity()
  it('should update role', async () => {});

  // test findAll()
  it('should find all roles', async () => {});

  // test findAll() with soryby by name
  it('should find all roles with filter by name', async () => {});

  // test findOne()
  it('should find one role', async () => {});

  // test findOne() with relations
  it('should find one role with relations', async () => {});

  // test remove()
  it('should remove role', async () => {});
});
