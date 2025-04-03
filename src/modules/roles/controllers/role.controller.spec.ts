import { TestingModule } from '@nestjs/testing';
import { RoleController } from './role.controller';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { getRoleTestingModule } from '../utils/role-testing-module';
import { Role } from '../entities/role.entities';
import { RoleService } from '../services/role.service';
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF } from '../../users/utils/constants';

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
      { name: ROLE_ADMIN } as Role,
      { name: ROLE_MANAGER } as Role,
      { name: ROLE_STAFF } as Role,
    ];
    roles.map(role => role.id = roleId++);

    jest.spyOn(roleService, "create").mockImplementation(async (createDto: CreateRoleDto) => {
      const exists = roles.find(role => role.name === createDto.name)
      if(exists){
        return null;
      }

      const role = {
        id: roleId++,
        name: createDto.name,
      } as Role;

      roles.push(role);

      return role;
    });

    
    jest.spyOn(roleService, "update").mockImplementation(async (id: number, updateDto: UpdateRoleDto) => {
      const index = roles.findIndex(role => role.id === id);
      if(index === -1) return null;

      if(updateDto.name){
        roles[index].name = updateDto.name;
      }

      return roles[index];
    });

    jest.spyOn(roleService, "findAll").mockResolvedValue(roles);

    jest.spyOn(roleService, "findOne").mockImplementation(async (id: number) => {
      return roles.find(role => role.id === id) || null;
    });
    
    jest.spyOn(roleService, "remove").mockImplementation(async (id: number) =>{
      const index = roles.findIndex(role => role.id === id);
      if (index === -1) return false;

      roles.splice(index, 1);

      return true;
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all roles', async () => {
      const result = await controller.findAll();
      expect(result.length).not.toEqual(0);
  });
  
  it("should get one role by id", async () => {
    const result = await controller.findOne(1);
    expect(result).not.toBeNull();
  });

  it("should not return one role (bad id)", async () => {
    await expect(controller.findOne(0)).resolves.toBeNull();
  });

  it("should create and return a role", async () => {
    const dto = { name: "newRole" } as Role;
    const result = await controller.create(dto);
    expect(result).not.toBeNull();
  });

  it("should fail to create a role (non-unique name)", async () => {
    const dto = { name: "newRole" } as Role;
    const result = await controller.create(dto);
    expect(result).toBeNull();
  });

  it("should update a role", async () => {
    const toUpdate = await controller.findOne(4);
    if(!toUpdate){ throw new Error('role to update returned null'); } 

    const dto = {
      name: "updatedRole"
    } as UpdateRoleDto;

    const result = await controller.update(toUpdate.id, dto);
    expect(result).not.toBeNull();
  });

  it("should remove a role", async () => {
    const removal = await controller.remove(4);

    await expect(removal).toBeTruthy();
    await expect(controller.findOne(4)).resolves.toBeNull();
  });

  it("should fail to remove a role (bad id)", async () => {
    const result = await controller.remove(4);
    expect(result).toBeFalsy();
  });
});
