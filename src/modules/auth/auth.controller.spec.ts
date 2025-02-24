import { TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { getAuthTestingModule } from './utils/auth-testing-module';
import { AuthService } from './auth.service';
import { RoleFactory } from '../roles/entities/role.factory';
import { UserFactory } from '../users/entities/user.factory';
import { isPassHashMatch } from './utils/hash';
import { UnauthorizedException } from '@nestjs/common';
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

    let users = await userFactory.getTestUsers();

    jest.spyOn(authService, "signIn").mockImplementation(async (username, pass) => {
      const user = users.find(user => user.username === username);
      if(!user || !(await isPassHashMatch(pass,user.passwordHash))) throw new UnauthorizedException();
      return { access_token: 'mock_token' };
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it("should sign in", async () => {
    const username = 'userA'
    const pass = 'passA'
    const result = await controller.signIn({ username: username, password: pass} as SignInDto);
    expect(result.access_token).toEqual('mock_token');
  });

  it("should fail to sign in (username doesnt exist)", async () => {
    const username = 'userE'
    const pass = 'passA'
    await expect(controller.signIn({ username: username, password: pass} as SignInDto)).rejects.toThrow(UnauthorizedException);
  });

  it("should fail to sign in (wrong password)", async () => {
    const username = 'userA'
    const pass = 'passB'
    await expect(controller.signIn({ username: username, password: pass} as SignInDto)).rejects.toThrow(UnauthorizedException);
  });

});
