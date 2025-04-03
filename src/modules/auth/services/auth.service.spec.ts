import { UnauthorizedException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UserService } from '../../users/services/user.service';
import { getAuthTestingModule } from '../utils/auth-testing-module';



describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;

  beforeAll(async () => {
    const module: TestingModule = await getAuthTestingModule();
    userService = module.get<UserService>(UserService);
    service = module.get<AuthService>(AuthService);
  });

  afterAll(async() => {
    const userQueryBuilder = userService.getQueryBuilder();
    await userQueryBuilder.delete().execute();
  })
  
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it("should sign in", async () => {
    const dto = {
      username: "loginUser",
      password: "loginPassword",
      email: "loginUser@email.com",
    } as CreateUserDto;

    const creation = await userService.create(dto);
    if(!creation){ throw new Error("insert user failed"); }

    const result = await service.signIn(dto.username, dto.password);

    expect(result.access_token).not.toBeNull();
  })

  it("should fail sign in (incorrect password)", async() => {
    await expect(service.signIn("loginUser", "wrongPassword")).rejects.toThrow(UnauthorizedException);
  })

  it("should fail sign in (no user)", async() => {
    await expect(service.signIn("nonExistingUser", "wrongPassword")).rejects.toThrow(UnauthorizedException);
  })
});
