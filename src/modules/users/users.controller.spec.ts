import { TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UserFactory } from './entities/user.factory';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { getUsersTestingModule } from './utils/users-testing-module';

describe('UsersController', () => {
  let controller: UsersController;
  let userFactory: UserFactory;
  let usersService: UsersService;

  beforeAll(async () => {
    const module: TestingModule = await getUsersTestingModule();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService)
    userFactory = module.get<UserFactory>(UserFactory);

    let users = await userFactory.getTestUsers();

    jest.spyOn(usersService, "create").mockImplementation(async (createDto : CreateUserDto) => {
      const exists = users.find(user => user.username === createDto.username)
      if(exists){ throw new Error('User already exists'); }

      const user = await userFactory.createDtoToEntity(createDto);
      user.id = 5;
      users.push(user)

      return user;
    });

    jest.spyOn(usersService, "update").mockImplementation(async (id: number, updateDto: UpdateUserDto) => {
      const exists = users.find(user => user.id === id)
      if(!exists){ throw new Error("User doesn't exist"); }

      const updated = await userFactory.updateDtoToEntity(updateDto);
      updated.id = id;

      const index = users.findIndex(user => user.id == id);
      if(index === -1){
        throw new Error("User not found");
      }

      users.splice(index, 1);
      users.push(updated);

      return updated;
    });

    jest.spyOn(usersService, "findAll").mockResolvedValue(users);
    
    jest.spyOn(usersService, "findOne").mockImplementation(async (id) => {
      return users.find(user => user.id === id) || null;
    });

    jest.spyOn(usersService, "remove").mockImplementation(async (id: number) => {
      const index = users.findIndex(user => user.id === id);
      if (index === -1) return false;
      
      users.splice(index, 1);
      return true;
    });

    jest.spyOn(usersService, "remove").mockImplementation(async (id: number) => {
      const originalLength = users.length;
      users = users.filter(user => user.id !== id);
      return users.length !== originalLength;
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it("should return all users", async () => {
      const users = await controller.findAll();
      expect(users.length).not.toBe(0);
  });
  
  it("should get one user by id", async () => {
    const user = await controller.findOne(1);
    expect(user).not.toBeNull();
  });

  it("should fail to get one user and return null (bad id/not found)", async () => {
    await expect(controller.findOne(0)).toBeNull();
  });

  it("should create a user", async () => {
    const newUser = userFactory.createDtoInstance({name: "newUser", rawPassword: "newPass", email: "newEmail@email.com" });
    const result = await controller.create(newUser);
    expect(result).not.toBeNull();
    expect(result?.id).toEqual(5);
  });

  it("should fail to create a user (non-unique username)", async () => {
    const newUser = userFactory.createDtoInstance({name: "newUser", rawPassword: "newPass", email: "newEmail@email.com" });
    await expect(controller.create(newUser)).rejects.toThrow(Error);
  });

  it("should update a user", async () => {
    const userToUpdate = await controller.findOne(5);
    if(!userToUpdate){ throw new Error("User to update is null."); }

    userToUpdate.username = "updatedUser";
    const result = await controller.update(userToUpdate.id, userToUpdate);

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(userToUpdate.id);
  });

  it("should remove a user by id", async () => {
      const result = await controller.remove(5);
      expect(result).toBeTruthy();

      await expect(controller.findOne(5)).toBeNull();
    });
  
    it("should fail to remove a user (bad id)", async () => {
      const result = await controller.remove(5);
      expect(result).toBeFalsy();
    });
});
