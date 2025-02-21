import { TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UserFactory } from './entities/user.factory';
import { getAuthTestingModule } from '../auth/utils/authTestingModule';
import { RolesService } from '../roles/roles.service';

describe('UsersService', () => {
  let usersService: UsersService;
  let rolesService: RolesService;
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
      usersService = module.get<UsersService>(UsersService);
      rolesService = module.get<RolesService>(RolesService);
      userFactory = module.get<UserFactory>(UserFactory);
  });
  
    
  afterAll(async() => {
      const roleQueryBuilder = rolesService.createRoleQueryBuilder();
      await roleQueryBuilder.delete().execute();
      const userQueryBuilder = usersService.createUserQueryBuilder();
      await userQueryBuilder.delete().execute();
  })

  it('should be defined', () => {
    expect(usersService).toBeDefined();
  });


  it("should insert a user", async () => {
    const role = await usersService.findOneByName(STAFF);
    if (!role) { throw new Error("Role 'staff' not found"); }

    const userDto = await userFactory.createDtoInstance(
      {username: testUserName, rawPassword: "testPass", email: "email@emaill.com", roleids: [role.id]});

    const result = await usersService.create(userDto);
    if(!result){ throw new Error("user creation fail, result is null. (Possibly already exists)"); }

    expect(result).not.toBeNull()
    expect(result.roles[0].name).toBe(STAFF);
  });


  it("should update the roles user reference", async () => {
    //const updatedRole = await usersService.findOne({ where: { name: STAFF }, relations: ["users"], });
    const updatedRole = await usersService.findOneByName(STAFF);
    expect(updatedRole).not.toBeNull();
    expect(updatedRole?.username).toBe(testUserName);
  });


  it("should remove a user", async () => {
    const user = await usersService.findOneByName(testUserName);
    if(!user){ throw new Error("testUser not found"); }

    const removal = await usersService.remove(user.id);
    if(!removal){ throw new Error("user removal failed"); }

    const shouldBeEmpty = await usersService.findOneByName(testUserName);

    expect(shouldBeEmpty).toBeNull();
  });


  it("should remove user reference from role", async () => {
    const affectedRole = await rolesService.findOneByName(STAFF);
    expect(affectedRole?.users).toBeUndefined();
  });


  it("should insert and remove user by id" , async () => {
    const userDto = userFactory.createDtoInstance(
      {username: "testIdUser" , rawPassword: "testIdPass",email: "email@email.com"});

    const creation = await usersService.create(userDto);
    if(!creation){ throw new Error("insert user failed"); }

    const result = await usersService.remove(creation.id);
    if(!result){ throw new Error("removal by id failed"); }

    const shouldBeEmpty = await usersService.findOne(creation.id);
    expect(shouldBeEmpty).toBeNull();
  })


  it("should update a user", async () =>{
    const userDto = userFactory.createDtoInstance(
      {username: "testUpdateUser", rawPassword: "testUpdatePass", email: "toUpdateEmail@email.com"});

    const creation = await usersService.create(userDto);
    if(!creation){ throw new Error("insert user failed"); }

    const toUpdate = await usersService.findOne(creation.id);
    if (!toUpdate) throw new Error("Failed to retrieve user to update.");

    toUpdate.email = "newEmail@email.com";

    const result = await usersService.update(toUpdate.id, toUpdate);
    if (!result) throw new Error("Failed to update user.");

    const updatedEmail = await usersService.findOne(result.id);
    expect(updatedEmail?.email).toBe("newEmail@email.com");
  })


  it("should get Users from a list of user ids", async () => {
    const userDtoA = userFactory.createDtoInstance(
      {username: USER_A, rawPassword:  "testAPass", email: "emailA@email.com"})
    await usersService.create(userDtoA);
    
    const userDtoB = userFactory.createDtoInstance(
      {username: USER_B, rawPassword:  "testBPass", email: "emailB@email.com" })
    await usersService.create(userDtoB);

    const userDtoC = userFactory.createDtoInstance(
      {username: USER_C, rawPassword:  "testCPass", email: "emailC@email.com" })
    await usersService.create(userDtoC);

    const list = await usersService.findAll();
    if(list.length == 0){
      throw new Error('list of users to retrieve is 0, cannot perform getRoles test.');
    }
    const result = await usersService.findUsersById(list.map(item => item.id))
    expect(result.length).toEqual(list.length);
  });
});
