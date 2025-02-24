import { TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { RoleFactory } from './entities/role.factory';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { getRolesTestingModule } from './utils/roles-testing-module';

describe('RolesController', () => {
  let controller: RolesController;
  let rolesService: RolesService;
  let roleFactory: RoleFactory;

  beforeAll(async () => {
    const module: TestingModule = await getRolesTestingModule();

    controller = module.get<RolesController>(RolesController);
    rolesService = module.get<RolesService>(RolesService);
    roleFactory = module.get<RoleFactory>(RoleFactory);

    let roles = roleFactory.getDefaultRoles();
    roles[0].id = 1;
    roles[1].id = 2;
    roles[2].id = 3;

    jest.spyOn(rolesService, "create").mockImplementation(async (createDto: CreateRoleDto) => {
      const exists = roles.find(role => role.name === createDto.name)
      if(exists){
        return null;
      }

      const role = roleFactory.createDtoToEntity(createDto);
      role.id = 4;
      roles.push(role);

      return role;
    });

    
    jest.spyOn(rolesService, "update").mockImplementation(async (id: number, updateDto: UpdateRoleDto) => {
      const exists = roles.find(role => role.id === id);
      if(!exists){
        throw new Error("Role to update doesn't exist");
      }

      const updated = roleFactory.updateDtoToEntity(updateDto);
      updated.id = id;
      roles.filter(role => role.id !== id);
      roles.push(updated);

      return updated;
    });

    jest.spyOn(rolesService, "findAll").mockResolvedValue(roles);

    jest.spyOn(rolesService, "findOne").mockImplementation(async (id: number) => {
      return roles.find(role => role.id === id) || null;
    });
    
    jest.spyOn(rolesService, "remove").mockImplementation(async (id: number) =>{
      const index = roles.findIndex(role => role.id === id);
      if (index === -1) return false;

      roles.splice(index, 1);
      console.log("Roles after removal:", roles);

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
    await expect(controller.findOne(0)).toBeNull();
  });

  it("should create and return a role", async () => {
    const roleDto = roleFactory.createDtoInstance({ name: "newRole" });

    const result = await controller.create(roleDto);
    expect(result?.id).toEqual(4);
  });

  it("should fail to create a role (non-unique name)", async () => {
    const roleDto = roleFactory.createDtoInstance({ name: "newRole" });
    await expect(controller.create(roleDto)).toBeNull();
  });

  it("should update a role", async () => {
    const roleToUpdate = await controller.findOne(4);
    if(!roleToUpdate){ throw new Error('role to update returned null'); } 

    roleToUpdate.name = "updatedRole";
    const result = await controller.update(roleToUpdate.id, roleToUpdate);
    expect(result).not.toBeNull();
  });

  it("should remove a role", async () => {
    const removal = await controller.remove(4);

    await expect(removal).toBeTruthy();
    await expect(controller.findOne(4)).toBeNull();
  });

  it("should fail to remove a role (bad id)", async () => {
    const result = await controller.remove(4);
    expect(result).toBeFalsy();
  });
});
