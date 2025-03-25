import { TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UserFactory } from './entities/user.factory';
import { RolesService } from '../roles/roles.service';
import { RoleFactory } from '../roles/entities/role.factory';
import { getUsersTestingModule } from './utils/users-testing-module';

describe('UsersService', () => {
  let usersService: UsersService;
  let rolesService: RolesService;
  let userFactory: UserFactory;
  let roleFactory: RoleFactory;

  const ADMIN = "admin";
  const MANAGER = "manager";
  const STAFF = "staff";
  
  const testUsername = "testUsername";
  const testUserPass = "testPass";
  const testUserEmail = "email@emaill.com";
  const testUserUpdatedEmail = "newEmail@email.com";
  let testUserId;

  beforeAll(async () => {
      const module: TestingModule = await getUsersTestingModule();
      usersService = module.get<UsersService>(UsersService);
      userFactory = module.get<UserFactory>(UserFactory);

      rolesService = module.get<RolesService>(RolesService);
      roleFactory = module.get<RoleFactory>(RoleFactory);

      await rolesService.create(
        roleFactory.createDtoInstance({name: ADMIN})
      );
      await rolesService.create(
        roleFactory.createDtoInstance({name: MANAGER})
      );
      await rolesService.create(
        roleFactory.createDtoInstance({name: STAFF})
      );
  });
    
  afterAll(async() => {
      const roleQueryBuilder = rolesService.getQueryBuilder();
      await roleQueryBuilder.delete().execute();

      const userQueryBuilder = usersService.getQueryBuilder();
      await userQueryBuilder.delete().execute();
  })

  it('should be defined', () => {
    expect(usersService).toBeDefined();
  });

  it("should insert a user", async () => {
    const role = await rolesService.findOneByName(STAFF);
    if (!role) { throw new Error("Role 'staff' not found"); }

    const result = await usersService.create(
      userFactory.createDtoInstance(
        {username: testUsername, password: testUserPass, email: testUserEmail, roleIds: [role.id]})
    );
    if(!result){ throw new Error("user creation fail, result is null. (Possibly already exists)"); }

    // For future test ease
    testUserId = result.id;

    expect(result).not.toBeNull()
    expect(result.roles[0].name).toBe(STAFF);
  });

  it("should update the roles user reference after user is assigned the role", async () => {
    //const updatedRole = await usersService.findOne({ where: { name: STAFF }, relations: ["users"], });
    const updatedRole = await rolesService.findOneByName(STAFF, ["users"]);
    expect(updatedRole).not.toBeNull();
    expect(updatedRole?.users[0].username).toBe(testUsername);
  });

  it("should update a user", async () =>{
    const toUpdate = await usersService.findOne(testUserId);
    if (!toUpdate) throw new Error("Failed to retrieve user to update.");

    toUpdate.email = testUserUpdatedEmail;

    const result = await usersService.update(toUpdate.id, toUpdate);
    if (!result) throw new Error("Failed to update user.");

    const updatedEmail = await usersService.findOne(result.id);

    expect(updatedEmail?.email).toBe(testUserUpdatedEmail);
    expect(result?.email).toBe(testUserUpdatedEmail);
    expect(toUpdate?.id).toEqual(updatedEmail?.id);
  })

  it("should remove a user", async () => {
    const user = await usersService.findOneByName(testUsername);
    if(!user){ throw new Error("testUsername not found"); }

    const removal = await usersService.remove(user.id);
    if(!removal){ throw new Error("user removal failed"); }

    const shouldBeEmpty = await usersService.findOneByName(testUsername);

    expect(shouldBeEmpty).toBeNull();
  });

  it("should remove user reference from role", async () => {
    const affectedRole = await rolesService.findOneByName(STAFF);
    if(!affectedRole){ throw new Error('affected role is null, may have deleted Role entity rather than reference.')}
    expect(affectedRole?.users).toBeUndefined();
  });

  it("should get Users from a list of user ids", async () => {
    await usersService.create(
      userFactory.createDtoInstance(
        {username: "USER_A", password: "testAPass", email: "emailA@email.com"})
    );
    
    await usersService.create(
      userFactory.createDtoInstance(
        {username: "USER_B", password: "testBPass", email: "emailB@email.com" })
      );

    await usersService.create(
      userFactory.createDtoInstance(
        {username: "USER_C", password: "testCPass", email: "emailC@email.com" })
      );

    const list = await usersService.findAll();
    if(list.length == 0){
      throw new Error('list of users to retrieve is 0, cannot perform getRoles test.');
    }
    const result = await usersService.findEntitiesById(list.map(item => item.id))
    expect(result.length).toEqual(list.length);
  });
});
