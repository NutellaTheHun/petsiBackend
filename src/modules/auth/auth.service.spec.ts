import { TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getAuthTestingModule } from './utils/authTestingModule';
import { RoleFactory } from './factories/role.factory';
import { Role } from './entities/role.entities';
import { UserFactory } from './factories/user.factory';
import { error } from 'console';
import { UnauthorizedException } from '@nestjs/common';
import { isQueryFailedError, isRole, isUser } from '../../util/type-checkers';

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
    const roleQueryBuilder = service.roles.createQueryBuilder();
    await roleQueryBuilder.delete().execute();
    const userQueryBuilder = service.users.createQueryBuilder();
    await userQueryBuilder.delete().execute();
  })
  

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a role', async () => {
      const role = new Role();
      role.name = "test";
      
      const result = await service.roles.create(role);
      if(isRole(result)){
        const saved = await service.roles.findOne({ where: { id: result.id } })
        expect(saved).not.toBeNull();
      }
      else if(isQueryFailedError(result)){
        throw new Error(`Insert role failed: ${result.message}`);
      }
      throw new error('result is not type Role (could be a queryError) role.create failed.')
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
    if(isRole(inputResult)){
      inputResult.name = "updatetest";
      const result = await service.roles.update(inputResult?.id, inputResult);
      expect(result.name).toBe("updatetest");
    }
    else if(isQueryFailedError(inputResult)){
      throw new Error(`Insert role failed: ${inputResult.message}`);
    }
    throw new error('inputResult is null or a queryError, service.createRole failed.');
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
    if(isUser(result)){
      expect(result).not.toBeNull()
      expect(result.roles[0].name).toBe(STAFF);
    }
    if(isQueryFailedError(result)){
      throw new Error(`Insert user failed: ${result.message}`);
    }
    throw new error('result is null, user already exists.')
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

  it("should insert and remove user by id" , async () => {
    const user = await userFactory.createUserInstance("testIdUser", "testIdPass", "email@email.com", [])
    const dto = userFactory.entityToCreateDto(user, "testIdPass");
    const creation = await service.createUser(dto);
    if(!creation){
      throw new error("insert user failed");
    }
    if(isUser(creation)){
      const result = await service.users.removeById(creation.id);
      if(!result){
        throw new error("removal by id failed");
      }
      const shouldBeEmpty = await service.users.findOne({ where: { id: creation.id }});

      expect(shouldBeEmpty).not.toBeNull();
    }
    if(isQueryFailedError(creation)){
      throw new Error(`Insert user failed: ${creation.message}`);
    }
    
  })

  it("should update a user", async () =>{
    const user = await userFactory.createUserInstance("testUpdateUser", "testUpdatePass", "toUpdateEmail@email.com", [])
    const dto = userFactory.entityToCreateDto(user, "testUpdatePass");
    const creation = await service.createUser(dto);
    if(!creation){
      throw new error("insert user failed");
    }
    if(isUser(creation)){
      const toUpdate = await service.users.findOne({ where: {id: creation.id } });
      if(toUpdate){
        toUpdate.email = "newEmail@email.com";
        const result = await service.users.update(toUpdate.id, toUpdate);
        const updatedEmail = await service.users.findOne({ where: {id: result.id } });
        expect(updatedEmail?.email).toBe("newEmail@email.com");
      } else{
        throw new error("failed to retrieve user to update.")
      }
    }
    if(isQueryFailedError(creation)){
      throw new Error(`create user failed: ${creation.message}`);
    }

  })
 
  it("should sign in", async () => {
    const user = await userFactory.createUserInstance("loginUser", "loginPassword", "loginUser@email.com", [])
    const dto = userFactory.entityToCreateDto(user, "loginPassword");
    const creation = await service.createUser(dto);
    if(!creation){
      throw new error("insert user failed");
    }
    const result = await service.signIn(user.username, "loginPassword");
    expect(result.access_token).not.toBeNull();
  })

  it("should fail sign in (incorrect password)", async() => {
    await expect(service.signIn("loginUser", "wrongPassword")).rejects.toThrow(UnauthorizedException);
  })

  it("should fail sign in (no user)", async() => {
    await expect(service.signIn("nonExistingUser", "wrongPassword")).rejects.toThrow(UnauthorizedException);
  })
});
