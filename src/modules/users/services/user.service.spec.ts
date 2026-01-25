import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { Role } from '../../roles/entities/role.entity';
import { RoleTestUtil } from '../../roles/utils/role-test.util';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entities';
import { USER_A } from '../utils/constants';
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
  let usersService: TestableUserService;
  let userTestingUtil: UserTestUtil;
  let roleTestingUtil: RoleTestUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;
  let userRepo: Repository<User>;
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
    userRepo = module.get(getRepositoryToken(User));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(usersService).toBeDefined();
  });

  // test createEntity() and not return password property
  it('should create user and not return password property', async () => {
    const [role] = await roleRepo.find({ take: 1 });
    if (!role) throw new Error('role not found');
    const dto: CreateUserDto = {
      name: 'newuser',
      password: 'secret123',
      email: 'new@example.com',
      roleIds: [role.id],
    };

    await dataSource.transaction(async (manager) => {
      const result = await usersService.createEntityForTest(dto, manager);
      expect(result).not.toBeNull();
      expect(result?.id).toBeDefined();
      expect(result.email).toEqual(dto.email);
      expect((result as any).password).toBeUndefined();
    });
  });

  // test updateEntity()
  it('should update user', async () => {
    const user = await userRepo.findOne({ where: { name: USER_A } });
    if (!user) throw new Error('user not found');

    const dto: UpdateUserDto = { name: 'User A Updated', email: 'updated@example.com' };

    await dataSource.transaction(async (manager) => {
      await usersService.updateEntityForTest(dto, user, manager);
    });

    const result = await userRepo.findOne({ where: { id: user.id } });
    if (!result) throw new Error('result not found');
    expect(result.name).toEqual(dto.name);
    expect(result.email).toEqual(dto.email);
  });

  // test findAll()
  it('should find all users', async () => {
    const repoResult = await userRepo.find();
    const serviceResult = await usersService.findAll({ limit: 100 });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
  });

  // test findAll() with search by name
  it('should find all users with search by name', async () => {
    const serviceResult = await usersService.findAll({
      search: 'user',
      limit: 100,
    });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toBeGreaterThan(0);
    expect(serviceResult?.items.every((u) => u.name.toLowerCase().includes('user'))).toBe(true);
  });

  // test findAll() with filter by role
  it('should find all users with filter by role', async () => {
    const [role] = await roleRepo.find({ take: 1 });
    if (!role) throw new Error('role not found');
    const repoResult = await userRepo
      .createQueryBuilder('u')
      .leftJoin('u.roles', 'r')
      .where('r.id = :id', { id: role.id })
      .getMany();
    const serviceResult = await usersService.findAll({
      filters: [`role=${role.id}`],
      limit: 100,
    });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
  });

  // test findAll() with sortBy name
  it('should find all users with sortBy name', async () => {
    const repoResult = await userRepo.find({ order: { name: 'DESC' } });
    const serviceResult = await usersService.findAll({
      sortBy: 'name',
      sortOrder: 'DESC',
      limit: 100,
    });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
    if (repoResult.length > 0) {
      expect(serviceResult?.items[0].name).toEqual(repoResult[0].name);
    }
  });

  // test findOne()
  it('should find one user', async () => {
    const user = await userRepo.find({ take: 1 });
    if (!user.length) throw new Error('user not found');

    const serviceResult = await usersService.findOne(user[0].id);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(user[0].id);
  });

  // test findOne() with relations
  it('should find one user with relations', async () => {
    const user = await userRepo.find({ take: 1 });
    if (!user.length) throw new Error('user not found');

    const serviceResult = await usersService.findOne(user[0].id, ['roles']);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(user[0].id);
    expect(serviceResult?.roles).toBeDefined();
    expect(Array.isArray(serviceResult?.roles)).toBe(true);
  });

  // test remove()
  it('should remove user', async () => {
    const user = await userRepo.findOne({ where: { name: 'newuser' } });
    if (!user) throw new Error('user not found (create "newuser" first)');
    const id = user.id;

    const deleteResult = await usersService.remove(id);
    expect(deleteResult).toBe(true);
    await expect(usersService.findOne(id)).rejects.toThrow(NotFoundException);
  });
});
