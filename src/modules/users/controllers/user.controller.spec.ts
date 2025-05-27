import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { hashPassword } from '../../auth/utils/hash';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entities';
import { UserService } from '../services/user.service';
import { USER_A, USER_B, USER_C, USER_D } from '../utils/constants';
import { getUserTestingModule } from '../utils/user-testing-module';
import { UserController } from './user.controller';

describe('User Controller', () => {
    let controller: UserController;
    let usersService: UserService;
    let userId = 1;

    beforeAll(async () => {
        const module: TestingModule = await getUserTestingModule();

        controller = module.get<UserController>(UserController);
        usersService = module.get<UserService>(UserService)

        let users = [
            { username: USER_A, password: await hashPassword("passA"), email: "email_A@email.com" } as User,
            { username: USER_B, password: await hashPassword("passB"), email: "email_B@email.com" } as User,
            { username: USER_C, password: await hashPassword("passC"), email: "email_C@email.com" } as User,
            { username: USER_D, password: await hashPassword("passD"), email: "email_D@email.com" } as User,
        ];
        users.map(user => user.id = userId++);

        jest.spyOn(usersService, "create").mockImplementation(async (createDto: CreateUserDto) => {
            const exists = users.find(user => user.username === createDto.username);
            if (exists) { throw new BadRequestException(); }

            const user = {
                id: userId++,
                username: createDto.username,
                email: createDto.email,
                password: createDto.password,
            } as User;

            users.push(user)

            return user;
        });

        jest.spyOn(usersService, "update").mockImplementation(async (id: number, updateDto: UpdateUserDto) => {
            const index = users.findIndex(user => user.id == id);
            if (index === -1) {
                throw new Error("User not found");
            }

            if (updateDto.email) {
                users[index].email = updateDto.email;
            }
            if (updateDto.password) {
                users[index].password = updateDto.password;
            }
            if (updateDto.username) {
                users[index].username = updateDto.username;
            }

            return users[index];
        });

        jest.spyOn(usersService, "findAll").mockResolvedValue({ items: users });

        jest.spyOn(usersService, "findOne").mockImplementation(async (id) => {
            const result = users.find(user => user.id === id);
            if (!result) {
                throw new NotFoundException();
            }
            return result;
        });

        jest.spyOn(usersService, "remove").mockImplementation(async (id: number) => {
            const index = users.findIndex(user => user.id === id);
            if (index === -1) return false;

            users.splice(index, 1);
            return true;
        });
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it("should return all users", async () => {
        const users = await controller.findAll();
        expect(users.items.length).not.toBe(0);
    });

    it("should get one user by id", async () => {
        const user = await controller.findOne(1);
        expect(user).not.toBeNull();
    });

    it("should fail to get one user (bad id/not found)", async () => {
        await expect(controller.findOne(0)).rejects.toThrow(NotFoundException);
    });

    it("should create a user", async () => {
        const dto = {
            username: "newUser",
            password: "newPass",
            email: "newEmail@email.com",
        } as CreateUserDto;
        const result = await controller.create(dto);
        expect(result).not.toBeNull();
    });

    it("should fail to create a user (non-unique username)", async () => {
        const dto = {
            username: "newUser",
            password: "newPass",
            email: "newEmail@email.com",
        } as CreateUserDto;

        await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });

    it("should update a user", async () => {
        const userToUpdate = await controller.findOne(5);
        if (!userToUpdate) { throw new Error("User to update is null."); }

        const dto = {
            username: "updatedUser",
        } as UpdateUserDto;
        const result = await controller.update(userToUpdate.id, dto);

        expect(result).not.toBeNull();
        expect(result?.username).toEqual("updatedUser");
    });

    it("should remove a user by id", async () => {
        const result = await controller.remove(5);
        expect(result).toBeUndefined();

        await expect(controller.findOne(5)).rejects.toThrow(NotFoundException);
    });

    it("should fail to remove a user (bad id)", async () => {
        await expect(controller.remove(5)).rejects.toThrow(NotFoundException);
    });
});
