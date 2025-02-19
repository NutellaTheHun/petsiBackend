import { TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { getAuthTestingModule } from './utils/authTestingModule';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService

  beforeEach(async () => {
    const module: TestingModule = await getAuthTestingModule();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
