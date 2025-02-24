import { TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { UsersService } from '../users/users.service';
import { RoleFactory } from './entities/role.factory';
import { UserFactory } from '../users/entities/user.factory';
import { getRolesTestingModule } from './utils/roles-testing-module';

describe('RolesService', () => {
  let usersService: UsersService;
  let rolesService: RolesService;
  let roleFactory: RoleFactory;
  let userFactory: UserFactory;

  const ADMIN = "admin";
  const MANAGER = "manager";
  const STAFF = "staff";
  
  const testRoleName = "testRole";
  const testRoleUpdateName = "updateTestRole";
  let testRoleId;
  
  beforeAll(async () => {
      const module: TestingModule = await getRolesTestingModule();
      usersService = module.get<UsersService>(UsersService);
      rolesService = module.get<RolesService>(RolesService);

      userFactory = module.get<UserFactory>(UserFactory);
      roleFactory = module.get<RoleFactory>(RoleFactory);
  });
  
  afterAll(async() => {
    const roleQueryBuilder = rolesService.createRoleQueryBuilder();
    await roleQueryBuilder.delete().execute();

    const userQueryBuilder = usersService.createUserQueryBuilder();
    await userQueryBuilder.delete().execute();
  })

  it('should be defined', () => {
    expect(rolesService).toBeDefined();
  });

  it('should create a test role', async () => {
    const result = await rolesService.create(
      roleFactory.createDtoInstance({name: testRoleName })
    );
    if(!result){ throw new Error("Role creation failed, inputResult is null. (Possibly already exists)"); }

    // For future test ease
    testRoleId = result.id;

    const saved = await rolesService.findOne(result.id)
    
    expect(saved).not.toBeNull();
  });

  it("should update the test role", async () => {

    const testRole = await rolesService.findOne(testRoleId);
    if(!testRole){ throw new Error("Role retrieval failed, testRole is null. (Possibly doesn't exist)"); }

    testRole.name = testRoleUpdateName;

    const result = await rolesService.update(testRoleId, testRole);

    const retrieval = await rolesService.findOne(testRoleId);

    expect(result?.name).toBe(testRoleUpdateName);
    expect(retrieval?.name).toBe(testRoleUpdateName);
    expect(retrieval?.id).toEqual(result?.id);
  });

  it('should remove the test role', async () => {

    const testRole = await rolesService.findOne(testRoleId);
    if(!testRole) { throw new Error('role to delete was not found, testRole is null.'); }

    await rolesService.remove(testRole.id);
    const exists = await rolesService.findOne(testRole.id);

    expect(exists).toBeFalsy();
  });

  it("should create default roles", async () => {
    const roles = roleFactory.getTestingRoles();
    const result = await Promise.all(
      roles.map(roleEntity => 
        rolesService.create(roleFactory.createDtoInstance({name: roleEntity.name})) 
      )
    );

    expect(result.length).toEqual(roles.length);
  });

  it("should retrieve all default roles", async () => {
    const result = await rolesService.findAll()
    const roles = roleFactory.getTestingRoles();

    expect(result.length).toEqual(roles.length);
  });

  it("should get role by name ADMIN", async () => {
    const result = await rolesService.findOneByName(ADMIN);
    expect(result?.name).toBe(ADMIN);
  });

  it("should get role by name MANAGER", async () => {
    const result = await rolesService.findOneByName(MANAGER);
    expect(result?.name).toBe(MANAGER);
  });

  it("should get role by name STAFF", async () => {
    const result = await rolesService.findOneByName(STAFF);
    expect(result?.name).toBe(STAFF);
  });

  it("should get Roles from a list of role ids", async () => {
    const list = await rolesService.findAll();
    if(list.length == 0){
      throw new Error('list of roles to retrieve is 0, cannot perform getRoles test.');
    }
    const result = await rolesService.findRolesById(list.map(item => item.id))
    expect(result.length).toEqual(list.length);
  });
});
