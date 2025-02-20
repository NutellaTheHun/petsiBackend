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

  const USER_A = "userA";
  const USER_B = "userB";
  const USER_C = "userC";

  beforeAll(async () => {
    const module: TestingModule = (await getAuthTestingModule());
    roleFactory = module.get<RoleFactory>(RoleFactory);
    service = module.get<AuthService>(AuthService);
    userFactory = module.get<UserFactory>(UserFactory);
  });

  
  afterAll(async() => {
    const roleQueryBuilder = service.createRoleQueryBuilder();
    await roleQueryBuilder.delete().execute();
    const userQueryBuilder = service.createUserQueryBuilder();
    await userQueryBuilder.delete().execute();
  })
  

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a role', async () => {
      const role = roleFactory.createDtoInstance({name: "test" })
      const result = await service.createRole(role);

      if(isRole(result)){
        const saved = await service.roleRepo.findOne({ where: { id: result.id } })
        expect(saved).not.toBeNull();
      }
      else if(isQueryFailedError(result)){
        throw new Error(`Insert role failed: ${result.message}`);
      }
      else {
        throw new Error('result is not type Role (could be a queryError) role.create failed.');
      }
  });

  it('should delete a role', async () => {
    const roleName = "test";

    const saved = await service.roleRepo.findOne({ where: { name: roleName } })
    if(saved){
      await service.roleRepo.remove(saved);
    }

    const exists = await service.roleRepo.findOne({ where: { name: roleName } })
    expect(exists).toBeFalsy();
  });

  it("should create default roles", async () => {
    const roles = roleFactory.getTestingRoles();
    const result = await Promise.all(
      roles.map(roleEntity => 
        service.createRole(roleFactory.createDtoInstance({name: roleEntity.name})) 
      )
    );
    expect(result.length).toEqual(roles.length);
  });

  it("should retrieve all roles", async () => {
    const result = await service.roleRepo.find()
    const roles = roleFactory.getTestingRoles();

    expect(result.length).toEqual(roles.length);
  });

  it("should equal default role ADMIN", async () => {
    const result = await service.roleRepo.findOne({ where: { name: ADMIN } })
    expect(result?.name).toBe(ADMIN);
  });

  it("should equal default role MANAGER", async () => {
    const result = await service.roleRepo.findOne({ where: { name: MANAGER } })
    expect(result?.name).toBe(MANAGER);
  });

  it("should equal default role STAFF", async () => {
    const result = await service.roleRepo.findOne({ where: { name: STAFF } })
    expect(result?.name).toBe(STAFF);
  });

  it("should insert test role and update to UPDATETEST", async () => {
    const testRoleDto = await roleFactory.createDtoInstance({name: "test"});
    const inputResult = await service.createRole(testRoleDto);

    if(isRole(inputResult)) {
      inputResult.name = "updatetest";
      const result = await service.roleRepo.save(inputResult);

      expect(result.name).toBe("updatetest");
      expect(inputResult.id).toEqual(result.id);
    }
    else if(isQueryFailedError(inputResult)) {
      throw new Error(`Insert role failed: ${inputResult.message}`);
    }
    else {
      throw new Error('inputResult is null or a queryError, service.createRole failed.');
    }
    
  });

  it("should remove role UPDATETEST", async () => {
    const role = await service.roleRepo.findOne({ where: { name: "updatetest" } });
    if(!role){
      throw new Error("updatetest role to remove not found.")
    }
    
    const results = await service.roleRepo.delete(role.id);

    const checkRole = await service.roleRepo.findOne({ where: { id: role.id } });
    expect(checkRole).toBeNull();
  });

  it("should insert a user", async () => {

    const role = await service.roleRepo.findOne({ where: { name: STAFF } })
    if (!role) {
      throw new Error("Role 'staff' not found");
    }

    //const user = await userFactory.createUserInstance(testUserName, "testPass", "email@email.com", roles)
    const userDto = await userFactory.createDtoInstance(
      {username: testUserName, rawPassword: "testPass", email: "email@emaill.com", roleids: [role.id]})

    const result = await service.createUser(userDto);

    if(isUser(result)){
      expect(result).not.toBeNull()
      expect(result.roles[0].name).toBe(STAFF);
    }
    else if(isQueryFailedError(result)){
      throw new Error(`Insert user failed: ${result.message}`);
    }
    else {
      throw new Error('result is null, user already exists.');
    }
    
  });

  it("should update the roles user reference", async () => {

    const updatedRole = await service.roleRepo.findOne({ where: { name: STAFF }, relations: ["users"], });
    expect(updatedRole).not.toBeNull();
    expect(updatedRole?.users[0].username).toBe(testUserName);
  });

  it("should remove a user", async () => {
    const user = await service.userRepo.findOne({ where: { username: testUserName } });
    if(!user){
      throw new Error("testUser not found")
    }

    const removal = await service.userRepo.remove(user);
    if(!removal){
      throw new Error("user removal failed");
    }

    const shouldBeEmpty = await service.userRepo.findOne({ where: { username: testUserName } });

    expect(shouldBeEmpty).toBeNull();
  });

  it("should remove user reference from role", async () => {
    const affectedRole = await service.roleRepo.findOne({ where: { name: STAFF } });
    expect(affectedRole?.users).toBeUndefined();
  });

  it("should insert and remove user by id" , async () => {
    //const user = await userFactory.createUserInstance("testIdUser", "testIdPass", "email@email.com", [])
    //const dto = userFactory.entityToCreateDto(user, "testIdPass");
    const userDto = userFactory.createDtoInstance(
      {username: "testIdUser" , rawPassword: "testIdPass",email: "email@email.com"})
    const creation = await service.createUser(userDto);
    if(!creation){
      throw new error("insert user failed");
    }
    if(isUser(creation)){
      const result = await service.deleteUser(creation.id);
      if(!result){
        throw new error("removal by id failed");
      }
      //const shouldBeEmpty = await service.userRepo.findOne({ where: { id: creation.id }});
      const shouldBeEmpty = await service.getUser(creation.id)

      expect(shouldBeEmpty).toBeNull();
    }
    if(isQueryFailedError(creation)){
      throw new Error(`Insert user failed: ${creation.message}`);
    }
    
  })

  it("should update a user", async () =>{
    //const user = await userFactory.createUserInstance("testUpdateUser", "testUpdatePass", "toUpdateEmail@email.com", [])
    //const dto = userFactory.entityToCreateDto(user, "testUpdatePass");
    const userDto = userFactory.createDtoInstance(
      {username: "testUpdateUser", rawPassword: "testUpdatePass", email: "toUpdateEmail@email.com"})
    const creation = await service.createUser(userDto);
    if(!creation){
      throw new Error("insert user failed");
    }
    if(isUser(creation)){
      const toUpdate = await service.userRepo.findOne({ where: {id: creation.id } });
      if(toUpdate){
        toUpdate.email = "newEmail@email.com";
        const result = await service.userRepo.save(toUpdate);
        const updatedEmail = await service.userRepo.findOne({ where: {id: result.id } });
        expect(updatedEmail?.email).toBe("newEmail@email.com");
      } else{
        throw new Error("failed to retrieve user to update.")
      }
    }
    if(isQueryFailedError(creation)){
      throw new Error(`create user failed: ${creation.message}`);
    }

  })
 
  it("should sign in", async () => {
    //const user = await userFactory.createUserInstance("loginUser", "loginPassword", "loginUser@email.com", [])
    //const dto = userFactory.entityToCreateDto(user, "loginPassword");
    const userDto = userFactory.createDtoInstance(
      {username: "loginUser", rawPassword: "loginPassword", email: "loginUser@email.com"})
    const creation = await service.createUser(userDto);
    if(!creation){
      throw new Error("insert user failed");
    }
    const result = await service.signIn(userDto.username, userDto.rawPassword);
    expect(result.access_token).not.toBeNull();
  })

  it("should fail sign in (incorrect password)", async() => {
    await expect(service.signIn("loginUser", "wrongPassword")).rejects.toThrow(UnauthorizedException);
  })

  it("should fail sign in (no user)", async() => {
    await expect(service.signIn("nonExistingUser", "wrongPassword")).rejects.toThrow(UnauthorizedException);
  })

  it("should get Roles from a list of role ids", async () => {
    const list = await service.roleRepo.find();
    if(list.length == 0){
      throw new Error('list of roles to retrieve is 0, cannot perform getRoles test.');
    }
    const result = await service.getRolesById(list.map(item => item.id))
    expect(result.length).toEqual(list.length);
  });

  it("should get Users from a list of user ids", async () => {
    //const userA = await userFactory.createUserInstance(USER_A, "testAPass", "emailA@email.com", [])
    //const dtoA = userFactory.entityToCreateDto(userA, "testAPass");
    const userDtoA = userFactory.createDtoInstance(
      {username: USER_A, rawPassword:  "testAPass", email: "emailA@email.com"})
    await service.createUser(userDtoA);
    
    //const userB = await userFactory.createUserInstance(USER_B, "testBPass", "emailB@email.com", [])
    //const dtoB = userFactory.entityToCreateDto(userB, "testBPass");
    const userDtoB = userFactory.createDtoInstance(
      {username: USER_B, rawPassword:  "testBPass", email: "emailB@email.com" })
    await service.createUser(userDtoB);

    //const userC = await userFactory.createUserInstance(USER_C, "testCPass", "emailC@email.com", [])
    //const dtoC = userFactory.entityToCreateDto(userC, "testCPass");
    const userDtoC = userFactory.createDtoInstance(
      {username: USER_C, rawPassword:  "testCPass", email: "emailC@email.com" })
    await service.createUser(userDtoC);

    const list = await service.userRepo.find();
    if(list.length == 0){
      throw new Error('list of users to retrieve is 0, cannot perform getRoles test.');
    }
    const result = await service.getUsersById(list.map(item => item.id))
    expect(result.length).toEqual(list.length);
  });
});
