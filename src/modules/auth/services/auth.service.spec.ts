import { UnauthorizedException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UserService } from '../../users/services/user.service';
import { getAuthTestingModule } from '../utils/auth-testing-module';
import { AuthService } from './auth.service';

const P = `t${Date.now()}`;

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let tenantRepo: Repository<Tenant>;
  let requestContext: TestRequestContextService;

  let tenant: Tenant;

  beforeAll(async () => {
    const module: TestingModule = await getAuthTestingModule();
    userService = module.get<UserService>(UserService);
    service = module.get<AuthService>(AuthService);
    tenantRepo = module.get(getRepositoryToken(Tenant));
    requestContext = module.get(RequestContextService) as TestRequestContextService;

    tenant = await tenantRepo.save({ name: `${P}-tenant`, subdomain: `${P}-subdomain` });
    requestContext.setContext({ tenantId: tenant.id });
  });

  afterAll(async () => {
    const userQueryBuilder = userService.getQueryBuilder();
    await userQueryBuilder.delete().execute();
    await tenantRepo.delete(tenant.id);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should sign in', async () => {
    const dto = {
      name: 'loginUser',
      password: 'loginPassword',
      email: 'loginUser@email.com',
    } as CreateUserDto;

    const creation = await userService.create(dto);
    if (!creation) {
      throw new Error('insert user failed');
    }

    const result = await service.signIn(dto.name, dto.password);

    expect(result.access_token).not.toBeNull();
  });

  it('should fail sign in (incorrect password)', async () => {
    await expect(service.signIn('loginUser', 'wrongPassword')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should fail sign in (no user)', async () => {
    await expect(
      service.signIn('nonExistingUser', 'wrongPassword'),
    ).rejects.toThrow(UnauthorizedException);
  });
});
