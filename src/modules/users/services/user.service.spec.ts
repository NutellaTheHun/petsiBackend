import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { Role } from '../../roles/entities/role.entity';
import { RoleTestUtil } from '../../roles/utils/role-test.util';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entities';
import { UserTestUtil } from '../utils/user-test.util';
import { getUserTestingModule } from '../utils/user-testing-module';
import { UserService } from './user.service';

class TestableUserService extends UserService {
  async createEntityForTest(
    dto: CreateUserDto,
    manager: EntityManager,
  ): Promise<User> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateUserDto,
    entity: User,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('User Service', () => {
  let usersService: UserService;
  let userTestingUtil: UserTestUtil;
  let roleTestingUtil: RoleTestUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;
  let roleRepo: Repository<Role>;

  beforeAll(async () => {
    const module: TestingModule = await getUserTestingModule({
      userServiceClass: TestableUserService,
    });
    dataSource = module.get(DataSource);
    dbTestContext = new DatabaseTestContext();

    usersService = module.get(UserService) as TestableUserService;

    roleRepo = module.get(getRepositoryToken(Role));

    userTestingUtil = module.get<UserTestUtil>(UserTestUtil);
    await userTestingUtil.initUserTestingDatabase(dbTestContext);
    roleTestingUtil = module.get<RoleTestUtil>(RoleTestUtil);
    await roleTestingUtil.initRoleTestingDatabase(dbTestContext);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(usersService).toBeDefined();
  });

  // test createEntity() and not return password property
  it('should create user and not return password property', async () => {});

  // test updateEntity()
  it('should update user', async () => {});

  // test findAll()
  it('should find all users', async () => {});

  // test findAll() with search by name
  it('should find all users with search by name', async () => {});

  // test findAll() with filter by role
  it('should find all users with filter by name', async () => {});

  // test findAll() with sortBy name
  it('should find all users with sortBy name', async () => {});

  // test findOne()
  it('should find one user', async () => {});

  // test findOne() with relations
  it('should find one user with relations', async () => {});

  // test remove()
  it('should remove user', async () => {});
});
