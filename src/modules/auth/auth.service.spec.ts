import { TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getAuthTestingModule } from './utils/authTestingModule';
import { RoleFactory } from './factories/role.factory';
import { Role } from './entities/role.entities';

describe('AuthService', () => {
  let service: AuthService;
  let roleFactory: RoleFactory;

  beforeAll(async () => {
    const module: TestingModule = (await getAuthTestingModule());

    roleFactory = new RoleFactory();
    service = module.get<AuthService>(AuthService);
  });

  
  afterAll(async() => {
    const roles = roleFactory.getTestingRoles();

    const dbRoles = await Promise.all(
      roles.map(role => 
        service.roles.findOne({where: {name: role.name}} )
      )
    );

    await Promise.all(
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

      const saved = await service.roles.findOne({where: {id: op.id}})
      
      expect(saved).not.toBeNull();
  });

  it('should delete a role', async () => {
    const roleName = "test";

    const saved = await service.roles.findOne({where: {name: roleName}})
    if(saved){
      await service.roles.remove(saved);
    }

    const exists = await service.roles.findOne({where: {name: roleName}})
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
    const result = await service.roles.findOne({ where: { name: "admin" }})
    expect(result?.name).toBe("admin");
  });

  it("should equal default role MANAGER", async () => {
    const result = await service.roles.findOne({ where: { name: "manager" }})
    expect(result?.name).toBe("manager");
  });

  it("should equal default role STAFF", async () => {
    const result = await service.roles.findOne({ where: { name: "staff" }})
    expect(result?.name).toBe("staff");
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
    const role = await service.roles.findOne({ where: { name: "updatetest" }});
    if(!role){
      throw new Error("updatetest role to remove not found.")
    }
    
    await service.roles.removeById(role.id);

    const checkRole = await service.roles.findOne({ where: { id: role.id }});
    expect(checkRole).toBeNull();
  });

});
