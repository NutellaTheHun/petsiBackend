import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Role } from '../entities/role.entity';
import { RoleService } from '../services/role.service';
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF } from '../utils/constants';
import { getRoleTestingModule } from '../utils/role-testing-module';
import { RoleController } from './role.controller';

describe('Role Controller', () => {
    let controller: RoleController;
    let roleService: RoleService;

    let roleId = 1;
    let roles: Role[];

    beforeAll(async () => {
        const module: TestingModule = await getRoleTestingModule();

        controller = module.get<RoleController>(RoleController);
        roleService = module.get<RoleService>(RoleService);

        roles = [
            { roleName: ROLE_ADMIN } as Role,
            { roleName: ROLE_MANAGER } as Role,
            { roleName: ROLE_STAFF } as Role,
        ];
        roles.map(role => role.id = roleId++);

        jest.spyOn(roleService, "create").mockImplementation(async (createDto: CreateRoleDto) => {
            const exists = roles.find(role => role.roleName === createDto.roleName)
            if (exists) { throw new BadRequestException(); }

            const role = {
                id: roleId++,
                roleName: createDto.roleName,
            } as Role;

            roles.push(role);

            return role;
        });


        jest.spyOn(roleService, "update").mockImplementation(async (id: number, updateDto: UpdateRoleDto) => {
            const index = roles.findIndex(role => role.id === id);
            if (index === -1) { throw new NotFoundException(); }

            if (updateDto.roleName) {
                roles[index].roleName = updateDto.roleName;
            }

            return roles[index];
        });

        jest.spyOn(roleService, "findAll").mockResolvedValue({ items: roles });

        jest.spyOn(roleService, "findOne").mockImplementation(async (id?: number) => {
            if (!id) { throw new BadRequestException(); }
            const result = roles.find(role => role.id === id);
            if (!result) {
                throw new NotFoundException();
            }
            return result;
        });

        jest.spyOn(roleService, "remove").mockImplementation(async (id: number) => {
            const index = roles.findIndex(role => role.id === id);
            if (index === -1) throw new NotFoundException();

            roles.splice(index, 1);

            return true;
        });
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return all roles', async () => {
        const result = await controller.findAll();
        expect(result.items.length).not.toEqual(0);
    });

    it("should get one role by id", async () => {
        const result = await controller.findOne(1);
        expect(result).not.toBeNull();
    });

    it("should not return one role (bad id)", async () => {
        await expect(controller.findOne(0)).rejects.toThrow(BadRequestException);
    });

    it("should create and return a role", async () => {
        const dto = { roleName: "newRole" } as Role;
        const result = await controller.create(dto);
        expect(result).not.toBeNull();
    });

    it("should fail to create a role (non-unique name)", async () => {
        const dto = { roleName: "newRole" } as Role;
        await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });

    it("should update a role", async () => {
        const toUpdate = await controller.findOne(4);
        if (!toUpdate) { throw new Error('role to update returned null'); }

        const dto = {
            roleName: "updatedRole"
        } as UpdateRoleDto;

        const result = await controller.update(toUpdate.id, dto);
        expect(result).not.toBeNull();
    });

    it("should remove a role", async () => {
        const removal = await controller.remove(4);

        await expect(removal).toBeUndefined();
        await expect(controller.findOne(4)).rejects.toThrow(NotFoundException);
    });

    it("should fail to remove a role (bad id)", async () => {
        await expect(controller.remove(4)).rejects.toThrow(NotFoundException);
    });
});
