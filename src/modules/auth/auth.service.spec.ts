import { TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getAuthTestingModule } from './utils/auth-testing-module';
import { UserFactory } from '../users/entities/user.factory';
import { UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';


describe('AuthService', () => {
  let service: AuthService;
  let userService: UsersService;
  let userFactory: UserFactory;

  beforeAll(async () => {
    const module: TestingModule = await getAuthTestingModule();
    userService = module.get<UsersService>(UsersService);
    service = module.get<AuthService>(AuthService);
    userFactory = module.get<UserFactory>(UserFactory);
  });

  afterAll(async() => {
    const userQueryBuilder = userService.getQueryBuilder();
    await userQueryBuilder.delete().execute();
  })
  
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it("should sign in", async () => {
    const userDto = userFactory.createDtoInstance(
      {username: "loginUser", password: "loginPassword", email: "loginUser@email.com"});

    const creation = await userService.create(userDto);
    if(!creation){ throw new Error("insert user failed"); }

    const result = await service.signIn(userDto.username, userDto.password);

    expect(result.access_token).not.toBeNull();
  })

  it("should fail sign in (incorrect password)", async() => {
    await expect(service.signIn("loginUser", "wrongPassword")).rejects.toThrow(UnauthorizedException);
  })

  it("should fail sign in (no user)", async() => {
    await expect(service.signIn("nonExistingUser", "wrongPassword")).rejects.toThrow(UnauthorizedException);
  })
});
