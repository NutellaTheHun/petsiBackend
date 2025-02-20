import { TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { getAuthTestingModule } from './utils/authTestingModule';
import { AuthService } from './auth.service';
import { RoleFactory } from './factories/role.factory';
import { UserFactory } from './factories/user.factory';
import { isPassHashMatch } from './utils/hash';
import { UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { error } from 'console';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { DeleteResult, Entity, FindManyOptions, FindOneOptions } from 'typeorm';
import { User } from './entities/user.entities';
import { Role } from './entities/role.entities';
import { isQueryFailedError, isRole, isUser } from '../../util/type-checkers';
import exp from 'constants';
import { SignInDto } from './dto/sign-in.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let roleFactory: RoleFactory;
  let userFactory: UserFactory;
  
  beforeAll(async () => {
    const module: TestingModule = await getAuthTestingModule();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    userFactory = module.get<UserFactory>(UserFactory);
    roleFactory = module.get<RoleFactory>(RoleFactory);

    const users = [
      await userFactory.createUserInstance("userA", "passA", "emailA", []),
      await userFactory.createUserInstance("userB", "passB", "emailB", []),
      await userFactory.createUserInstance("userC", "passC", "emailC", []),
      await userFactory.createUserInstance("userD", "passD", "emailD", []),
    ];
    users[0].id = 1;
    users[1].id = 2;
    users[2].id = 3;
    users[3].id = 4;

    const roles = roleFactory.getDefaultRoles();
    roles[0].id = 1;
    roles[1].id = 2;
    roles[2].id = 3;

    
    jest.spyOn(authService, "signIn").mockImplementation(async (username, pass) => {
      const user = users.find(user => user.username === username);
      if(!user || !(await isPassHashMatch(pass,user.passwordHash))) throw new UnauthorizedException();
      return { access_token: 'mock_token' };
    });

    
    jest.spyOn(authService, "createUser").mockImplementation(async (createDto : CreateUserDto) => {
      const exists = users.find(user => user.username === createDto.username)
      if(exists){
        throw new Error('User already exists');
      }
      const user = await userFactory.createDtoToEntity(createDto);
      user.id = 5;
      users.push(user)
      return user;
    });

    
    jest.spyOn(authService, "updateUser").mockImplementation(async (id: number, updateDto: UpdateUserDto) => {
      const exists = users.find(user => user.id === id)
      if(!exists){
        throw new Error('User doesn\'t exist');
      }
      const updated = await userFactory.updateDtoToEntity(updateDto);
      updated.id = id;
      users.filter(user => user.id !== id);
      users.push(updated);
      return updated;
    });

    
    jest.spyOn(authService, "createRole").mockImplementation(async (createDto: CreateRoleDto) => {
      const exists = roles.find(role => role.name === createDto.name)
      if(exists){
        throw new Error("role to create already exists");
      }
      const role = roleFactory.createDtoToEntity(createDto);
      role.id = 4;
      roles.push(role);
      return role;
    });

    
    jest.spyOn(authService, "updateRole").mockImplementation(async (id: number, updateDto: UpdateRoleDto) => {
      const exists = roles.find(role => role.id === id);
      if(!exists){
        throw new error("Role to update doesn't exist");
      }
      const updated = roleFactory.updateDtoToEntity(updateDto);
      updated.id = id;
      roles.filter(role => role.id !== id);
      roles.push(updated);
      return updated;
    });

    
    jest.spyOn(authService.users, "findAll").mockResolvedValue(users)

    
    jest.spyOn(authService.users, "find").mockImplementation(async (options) => {
      return users.filter(user => user.id === options.where);
    });

    
    jest.spyOn(authService.users, "remove").mockImplementation(async (entity: User) => {
      const result = DeleteResult;
      result.prototype.affected = 1;
      const originalSize = users.length;

      const user = users.find(user => user.id === entity.id);
      
      if(!user){
        return false;
      }
      
      users.filter(user => user.id !== entity.id);
      if(originalSize === users.length){
        return false;
      }

      return true;
    });

    
    jest.spyOn(authService.users, "removeById").mockImplementation(async (id: number) => {
      const originalSize = users.length;
      const result = DeleteResult;
      result.prototype.affected = 1;

      users.filter(user => user.id !== id);

      if(originalSize === users.length){
        return false;
      }
      
      return true;
    });

    
    jest.spyOn(authService.roles, "findAll").mockResolvedValue(roles);

    
    jest.spyOn(authService.roles, "find").mockImplementation(async (options: FindManyOptions<Role>) => {
      return roles.filter(role => role.id === options.where);
    });

    
    jest.spyOn(authService.roles, "remove").mockImplementation(async (entity: Role) =>{
      const result = DeleteResult;
      result.prototype.affected = 1;
      const originalSize = roles.length;

      const role = roles.find(role => role.id === role.id);
      
      if(!role){
        return false;
      }
      
      roles.filter(role => role.id !== entity.id);
      if(originalSize === users.length){
        return false;
      }

      return true;
    });

    
    jest.spyOn(authService.roles, "removeById").mockImplementation(async (id: number) => {
      const originalSize = roles.length;
      const result = DeleteResult;
      result.prototype.affected = 1;

      users.filter(role => role.id !== id);
      if(originalSize == roles.length){
        return false;
      }

      return true;
    });

  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // find all roles
  it('should return all roles', async () => {
    const result = await controller.findAllRoles();
    expect(result.length).not.toEqual(0);
  });

  // get role :id SUCCESS
  it("should get one role by id", async () => {
    const result = await controller.findOneRole(1);
    expect(isUser(result)).toBeTruthy();
  })

  // get role :id FAIL NOT FOUND
  it("should not return one role (bad id)", async () => {
    const result = await controller.findOneRole(0);
    expect(result).toBeNull();
  })

  // create role SUCCESS
  it("should create and return a role", async () => {
    const newRole = roleFactory.createRoleInstance("newRole", []);
    const result = await controller.createRole(roleFactory.entityToCreateDto(newRole));
    expect(result.id).toEqual(4);
  })

  // create role FAIL
  it("should fail to create a role (non-unique name)", async () => {
    const newRole = roleFactory.createRoleInstance("admin", []);
    //const result = await controller.createRole(roleFactory.entityToCreateDto(newRole));
    //expect(isQueryFailedError(result)).toBeTruthy();
    await expect(controller.createRole(roleFactory.entityToCreateDto(newRole))).rejects.toThrow(Error)
  })

  // update role :id SUCCESS
  it("should update a role", async () => {
    const roleToUpdate = await controller.findOneRole(4);
    if(roleToUpdate){
      roleToUpdate.name = "updatedRole";
      const result = await controller.updateRole(roleToUpdate.id, roleToUpdate);
      expect(isRole(result)).toBeTruthy();
    }
    throw new error('role to update returned null');
  })

  // update role :id FAIL
  //currently doesnt check by id to update
  /*
  it("should fail to update a role (bad id)", async () => {
    const roleToUpdate = await controller.findOneRole(4);
    if(roleToUpdate){
      roleToUpdate.name = "updatedRole";
      const result = await controller.updateRole(roleToUpdate.id, roleToUpdate);
      expect(isRole(result)).toBeTruthy();
    }
    throw new error('role to update returned null');
  })
  */

  // delete role :id SUCCESS
  it("should remove a role", async () => {
    const removal = await controller.removeRole(4);
    const notExist = await controller.findOneRole(4);
    expect(removal).toBeTruthy();
    expect(notExist).toBeNull();
  })

  // delete role :id fail
  it("should fail to remove a role (bad id)", async () => {
    const result = await controller.removeRole(4);
    expect(result).toBeFalsy();
  })

  // get all users
  it("should return all users", async () => {
    const users = await controller.findAllUsers();
    expect(users.length).not.toBe(0);
  })

  // get user :id SUCCESS
  it("should get one user by id", async () => {
    const user = await controller.findOneUser(1);
    expect(isUser(user)).toBeTruthy();
  })

  // get user :id FAIL
  it("should get one user and return null (bad id/not found)", async () => {
    const user = await controller.findOneUser(0);
    expect(user).toBeNull();
  })

  // create user SUCCESS
  it("should create a user", async () => {
    const newUser = await userFactory.createUserInstance("newUser", "newPass", "newEmail@email.com", []);
    const result = await controller.createUser(userFactory.entityToCreateDto(newUser, "newPass"));
    expect(isUser(result)).toBeTruthy();
    expect(result.id).toEqual(5);
  })

  // create user FAIL
  it("should fail to create a user (non-unique username)", async () => {
    const newUser = await userFactory.createUserInstance("userA", "passA", "emailA", []);
    await expect(controller.createUser(userFactory.entityToCreateDto(newUser, "passA"))).rejects.toThrow(Error);
  })

  // update user :id SUCCESS
  it("should update a user", async () => {
    const userToUpdate = await controller.findOneUser(5);
    if(isUser(userToUpdate)){
      userToUpdate.username = "updatedUser";
      const result = await controller.updateUser(userToUpdate.id, userToUpdate)
      expect(isUser(result)).toBeTruthy();
    }
  })

  // update user :id FAIL
  // cant cause error by bad id because id isnt checked currently
  /*
  it("should fail to update a user (bad id)", () => {
    
  })
  */

  // remove user :id SUCCESS
  it("should remove a user by id", async () => {
    const result = await controller.removeUser(5);
    expect(result).toBeTruthy();
  })

  // remove user :id FAIL
  it("should fail to remove a user (bad id)", async () => {
    const result = await controller.removeUser(5);
    expect(result).toBeFalsy();
  })

  // sign in SUCCESS
  it("should sign in", async () => {
    const username = 'userA'
    const pass = 'passA'
    const result = await controller.signIn({ username: username, password: pass} as SignInDto);
    expect(result.access_token).toEqual('mock_token');
  })

  // sign in FAIL No username
  it("should fail to sign in (username doesnt exist)", async () => {
    const username = 'userE'
    const pass = 'passA'
    await expect(controller.signIn({ username: username, password: pass} as SignInDto)).rejects.toThrow(UnauthorizedException);
  })

  //sign in Fail bad pword
  it("should fail to sign in (wrong password)", async () => {
    const username = 'userA'
    const pass = 'passB'
    await expect(controller.signIn({ username: username, password: pass} as SignInDto)).rejects.toThrow(UnauthorizedException);
  })

});
