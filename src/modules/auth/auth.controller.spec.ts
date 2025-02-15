import { TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { getAuthTestingModule } from './utils/authTestingModule';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await getAuthTestingModule();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
