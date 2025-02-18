import { TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getAuthTestingModule } from './utils/authTestingModule';
import { RoleFactory } from './factories/role.factory';
import { Role } from './entities/role.entities';
import { UserFactory } from './factories/user.factory';
import { User } from './entities/user.entities';
import { errorMonitor } from 'events';
import { getManager, getRepository } from 'typeorm';

describe('AuthService', () => {
  let service: AuthService;
  let roleFactory: RoleFactory;
  let userFactory: UserFactory;

  const ADMIN = "admin";
  const MANAGER = "manager";
  const STAFF = "staff";
  
  const testUserName = "testUser";

  beforeAll(async () => {
    const module: TestingModule = (await getAuthTestingModule());

    roleFactory = module.get<RoleFactory>(RoleFactory);
    service = module.get<AuthService>(AuthService);
    userFactory = module.get<UserFactory>(UserFactory);
  });

  
  afterAll(async() => {
    const roles = roleFactory.getTestingRoles();

    const dbRoles = await Promise.all(
      roles.map(role => 
        service.roles.findOne({where: { name: role.name } })
      )
    );

    const removalResults = await Promise.all(
      dbRoles.filter((role): role is Role => role !== null)
        .map(async (roleEntity) => await service.roles.remove(roleEntity))
    );
  })
  

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a role', async () => {
      const role = new Role();
      role.name = "test";
      
      const op = await service.roles.create(role);

      const saved = await service.roles.findOne({ where: { id: op.id } })
      
      expect(saved).not.toBeNull();
  });

  it('should delete a role', async () => {
    const roleName = "test";

    const saved = await service.roles.findOne({ where: { name: roleName } })
    if(saved){
      await service.roles.remove(saved);
    }

    const exists = await service.roles.findOne({ where: { name: roleName } })
    expect(exists).toBeFalsy();
  });

  it("should create default roles", async () => {
    const roles = roleFactory.getTestingRoles();
    const result = await Promise.all(
      roles.map(roleEntity => 
        service.createRole(roleFactory.entityToCreateDto(roleEntity)) 
      )
    );
    expect(result.length).toEqual(roles.length);
  });

  it("should retrieve all roles", async () => {
    const result = await service.roles.findAll()
    const roles = roleFactory.getTestingRoles();

    expect(result.length).toEqual(roles.length);
  });

  it("should equal default role ADMIN", async () => {
    const result = await service.roles.findOne({ where: { name: ADMIN } })
    expect(result?.name).toBe(ADMIN);
  });

  it("should equal default role MANAGER", async () => {
    const result = await service.roles.findOne({ where: { name: MANAGER } })
    expect(result?.name).toBe(MANAGER);
  });

  it("should equal default role STAFF", async () => {
    const result = await service.roles.findOne({ where: { name: STAFF } })
    expect(result?.name).toBe(STAFF);
  });

  it("should insert test role and update to UPDATETEST", async () => {
    const testRole = await roleFactory.createRoleInstance("test", []);
    const inputResult = await service.createRole(
      roleFactory.entityToCreateDto(testRole)
    )
    inputResult.name = "updatetest";
    const result = await service.roles.update(inputResult?.id, inputResult);
    expect(result.name).toBe("updatetest");
  });

  it("should remove role UPDATETEST", async () => {
    const role = await service.roles.findOne({ where: { name: "updatetest" } });
    if(!role){
      throw new Error("updatetest role to remove not found.")
    }
    
    const results = await service.roles.removeById(role.id);

    const checkRole = await service.roles.findOne({ where: { id: role.id } });
    expect(checkRole).toBeNull();
  });

  it("should insert a user", async () => {

    const role = await service.roles.findOne({ where: { name: STAFF } })
    if (!role) {
      throw new Error("Role 'staff' not found");
    }
    const roles = [role];
    const user = await userFactory.createUserInstance(testUserName, "testPass", "email@email.com", roles)
    const dto = userFactory.entityToCreateDto(user, "testPass");
    const result = await service.createUser(dto);
    expect(result).not.toBeNull()
    expect(result.roles[0].name).toBe(STAFF);
  });

  it("should update the roles user reference", async () => {

    const updatedRole = await service.roles.findOne({ where: { name: STAFF }, relations: ["users"], });
    expect(updatedRole).not.toBeNull();
    expect(updatedRole?.users[0].username).toBe(testUserName);
  });

  it("should remove a user", async () => {
    const user = await service.users.findOne({ where: { username: testUserName } });
    if(!user){
      throw new Error("testUser not found")
    }
    console.log(`user to removes id ${user?.id}`);  // Check the id value

    const removal = await service.users.remove(user);
    if(!removal){
      throw new Error("user removal failed");
    }

    const shouldBeEmpty = await service.users.findOne({ where: { username: testUserName } });

    expect(shouldBeEmpty).toBeNull();
  });

  it("should remove user reference from role", async () => {
    const affectedRole = await service.roles.findOne({ where: { name: STAFF } });
    expect(affectedRole?.users).toBeUndefined();
  });

  //updateUser()
    //check roles.user reference
  //removeUserById()
    //check roles.user reference
 
  // crud
    //findOne
    //findAll
    //find
    //remove
    //removeById
    //create
    //update
  

});
