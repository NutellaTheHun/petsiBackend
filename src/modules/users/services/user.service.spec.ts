import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { RoleTestUtil } from '../../roles/utils/role-test.util';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserService } from './user.service';
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF, USER_A } from '../utils/constants';
import { UserTestUtil } from '../utils/user-test.util';
import { getUserTestingModule } from '../utils/user-testing-module';
import { RoleService } from '../../roles/services/role.service';

describe('User Service', () => {
  let usersService: UserService;
  let userTestingUtil: UserTestUtil;
  let roleTestingUtil: RoleTestUtil;
  let dbTestContext: DatabaseTestContext;

  let rolesService: RoleService;
  
  const testUsername = "testUsername";
  const testUserPass = "testPass";
  const testUserEmail = "email@emaill.com";
  const updatedEmail = "UPDATEnewEmail@email.com";
  const updatedUsername = "UPDATEnewEmail@email.com";
  let testId: number;
  let testIds: number[];

  beforeAll(async () => {
      const module: TestingModule = await getUserTestingModule();
      usersService = module.get<UserService>(UserService);
      rolesService = module.get<RoleService>(RoleService);

      dbTestContext = new DatabaseTestContext();
      userTestingUtil = module.get<UserTestUtil>(UserTestUtil);
      await userTestingUtil.initUserTestingDatabase(dbTestContext);
      roleTestingUtil = module.get<RoleTestUtil>(RoleTestUtil);
      await roleTestingUtil.initRoleTestingDatabase(dbTestContext);
  });
    
  afterAll(async() => {
      await dbTestContext.executeCleanupFunctions();
  })

  it('should be defined', () => {
    expect(usersService).toBeDefined();
  });

  it("should insert a user", async () => {
    const role = await rolesService.findOneByName(ROLE_STAFF);
    if (!role) { throw new Error("Role 'staff' not found"); }

    const dto = {
      username: testUsername,
      email: testUserEmail,
      password: testUserPass,
      roleIds: [role.id]
    } as CreateUserDto;

    const result = await usersService.create(dto);
    if(!result){ throw new Error("created user is null"); }

    expect(result).not.toBeNull();
    expect(result.username).toEqual(testUsername);
    expect(result.email).toEqual(testUserEmail);
    expect(result.password).toEqual("");
    expect(result.roles[0].name).toEqual(ROLE_STAFF);

    testId = result.id;
  });

  it("should update a user", async () =>{
    const dto = {
      username: updatedUsername,
      email: updatedEmail,
    } as UpdateUserDto
    
    const result = await usersService.update(testId, dto);
    if (!result) throw new Error("Failed to update user.");

    expect(result).not.toBeNull();
    expect(result?.email).toEqual(updatedEmail);
    expect(result?.username).toEqual(updatedUsername);
  })

  it("should remove a user", async () => {
    const removal = await usersService.remove(testId);
    if(!removal){ throw new Error("user removal failed"); }

    const verify = await usersService.findOne(testId);
    expect(verify).toBeNull();
  });

  it("should get all users", async () => {
    const expected = await userTestingUtil.getTestUserEntities(dbTestContext);

    const results = await usersService.findAll()
    expect(results.length).toEqual(expected.length);

    testIds = [results[0].id, results[1].id, results[2].id ];
  });

  it("should get Users from a list of user ids", async () => {
    const results = await usersService.findEntitiesById(testIds);

    expect(results.length).toEqual(testIds.length);
    for(const result of results){
      expect(testIds.findIndex(id => id === result.id)).not.toEqual(-1);
    }
  });

  it("should update the roles user reference after user is assigned the role", async () => {
    const toUpdate = await usersService.findOneByName(USER_A);
    if(!toUpdate){ throw new Error("user_A is null"); }

    const adminRole = await rolesService.findOneByName(ROLE_ADMIN);
    if(!adminRole){ throw new Error("admin role is null"); }

    const dto = {
      roleIds: [adminRole.id],
    } as UpdateUserDto;

    const update = await usersService.update(toUpdate.id, dto);

    const verifyRole = await rolesService.findOneByName(ROLE_ADMIN, ["users"]);
    expect(verifyRole).not.toBeNull();
    expect(verifyRole?.users[0].username).toEqual(USER_A);
  });

  it("should update user reference from role Admin to role Staff, and update role user references", async () => {
    const toUpdate = await usersService.findOneByName(USER_A, ["roles"]);
    if(!toUpdate){ throw new Error("user_A is null"); }
    if(!toUpdate.roles){ throw new Error("user roles is null"); }
    expect(toUpdate.roles[0].name).toEqual(ROLE_ADMIN);

    const managerRole = await rolesService.findOneByName(ROLE_MANAGER);
    if(!managerRole){ throw new Error("admin role is null"); }

    const dto = {
      roleIds: [managerRole.id],
    } as UpdateUserDto;

    const update = await usersService.update(toUpdate.id, dto);

    const verifyRole = await rolesService.findOneByName(ROLE_MANAGER, ["users"]);
    expect(verifyRole).not.toBeNull();
    expect(verifyRole?.users[0].username).toEqual(USER_A);
  });

  it("should remove user reference from role", async () => {
    const toUpdate = await usersService.findOneByName(USER_A, ["roles"]);
    if(!toUpdate){ throw new Error("user_A is null"); }
    if(!toUpdate.roles){ throw new Error("user roles is null"); }
    expect(toUpdate.roles[0].name).toEqual(ROLE_MANAGER);

    const dto = {
      roleIds: [],
    } as UpdateUserDto;

    const update = await usersService.update(toUpdate.id, dto);

    const verifyRole = await rolesService.findOneByName(ROLE_ADMIN, ["users"]);
    expect(verifyRole).not.toBeNull();
    expect(verifyRole?.users.length).toEqual(0);
  });
});
