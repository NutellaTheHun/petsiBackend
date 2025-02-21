import { TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { UsersService } from '../users/users.service';
import { RoleFactory } from './entities/role.factory';
import { UserFactory } from '../users/entities/user.factory';
import { getAuthTestingModule } from '../auth/utils/authTestingModule';

describe('RolesService', () => {
  let usersService: UsersService;
  let rolesService: RolesService;
  let roleFactory: RoleFactory;
  let userFactory: UserFactory;

  const ADMIN = "admin";
  const MANAGER = "manager";
  const STAFF = "staff";
  
  const testUserName = "testUser";

  const USER_A = "userA";
  const USER_B = "userB";
  const USER_C = "userC";
  
  beforeAll(async () => {
      const module: TestingModule = (await getAuthTestingModule());
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


  it('should create a role', async () => {
    const role = roleFactory.createDtoInstance({name: "test" })

    const result = await rolesService.create(role);
    if(!result){ throw new Error("Role creation failed, inputResult is null. (Possibly already exists)"); }

    const saved = await rolesService.findOne(result.id)

    expect(saved).not.toBeNull();
  });


  it('should delete a role', async () => {
    const roleName = "test";

    const saved = await rolesService.findOneByName(roleName);
    if(!saved) { throw new Error('role to delete was not found, saved is null.'); }

    await rolesService.remove(saved.id);
    const exists = await rolesService.findOne(saved.id)

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


  it("should retrieve all roles", async () => {
    const result = await rolesService.findAll()
    const roles = roleFactory.getTestingRoles();

    expect(result.length).toEqual(roles.length);
  });


  it("should equal default role ADMIN", async () => {
    const result = await rolesService.findOneByName(ADMIN);
    expect(result?.name).toBe(ADMIN);
  });


  it("should equal default role MANAGER", async () => {
    const result = await rolesService.findOneByName(MANAGER);
    expect(result?.name).toBe(MANAGER);
  });


  it("should equal default role STAFF", async () => {
    const result = await rolesService.findOneByName(STAFF);
    expect(result?.name).toBe(STAFF);
  });


  it("should insert test role and update to UPDATETEST", async () => {
    const testRoleDto = await roleFactory.createDtoInstance({name: "test"});

    const inputResult = await rolesService.create(testRoleDto);
    if(!inputResult){ throw new Error("Role creation failed, inputResult is null. (Possibly already exists)"); }

    inputResult.name = "updatetest";
    const result = await rolesService.update(inputResult.id, inputResult);

    expect(result.name).toBe("updatetest");
    expect(inputResult.id).toEqual(result.id);
  });


  it("should remove role UPDATETEST", async () => {
    const role = await rolesService.findOneByName("updatetest");
    if(!role){ throw new Error("updatetest role to remove not found."); }
    
    await rolesService.remove(role.id);

    const checkRole = await rolesService.findOne(role.id);
    
    expect(checkRole).toBeNull();
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
