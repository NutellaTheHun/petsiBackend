import { TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

import { getAuthTestingModule } from './utils/authTestingModule';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = (await getAuthTestingModule());

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
