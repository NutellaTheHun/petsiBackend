import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { RoleFeature } from '../../feature-flags/entities/role-feature.entity';
import { TenantFeature } from '../../feature-flags/entities/tenant-feature.entity';
import { Location } from '../../locations/entities/location.entity';
import { UserLocation } from '../../locations/entities/user-location.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Role } from '../../roles/entities/role.entity';
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
  let locationRepo: Repository<Location>;
  let roleRepo: Repository<Role>;
  let userLocationRepo: Repository<UserLocation>;
  let tenantFeatureRepo: Repository<TenantFeature>;
  let roleFeatureRepo: Repository<RoleFeature>;
  let requestContext: TestRequestContextService;
  let jwtService: JwtService;

  let tenant: Tenant;
  let otherTenant: Tenant;

  beforeAll(async () => {
    const module: TestingModule = await getAuthTestingModule();
    userService = module.get<UserService>(UserService);
    service = module.get<AuthService>(AuthService);
    tenantRepo = module.get(getRepositoryToken(Tenant));
    locationRepo = module.get(getRepositoryToken(Location));
    roleRepo = module.get(getRepositoryToken(Role));
    userLocationRepo = module.get(getRepositoryToken(UserLocation));
    tenantFeatureRepo = module.get(getRepositoryToken(TenantFeature));
    roleFeatureRepo = module.get(getRepositoryToken(RoleFeature));
    requestContext = module.get(RequestContextService) as TestRequestContextService;
    jwtService = module.get(JwtService);

    tenant = await tenantRepo.save({ name: `${P}-tenant`, subdomain: `${P}-subdomain` });
    otherTenant = await tenantRepo.save({
      name: `${P}-other-tenant`,
      subdomain: `${P}-other-subdomain`,
    });
    requestContext.setContext({ tenantId: tenant.id });
  });

  afterAll(async () => {
    const userQueryBuilder = userService.getQueryBuilder();
    await userQueryBuilder.delete().execute();
    await tenantRepo.delete(tenant.id);
    await tenantRepo.delete(otherTenant.id);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should sign in and issue a JWT scoped to the resolved tenant', async () => {
    const dto = {
      name: 'loginUser',
      password: 'loginPassword',
      email: 'loginUser@email.com',
    } as CreateUserDto;

    const creation = await userService.create(dto);
    if (!creation) {
      throw new Error('insert user failed');
    }

    const result = await service.signIn(dto.name, dto.password, tenant.id);

    expect(result.access_token).not.toBeNull();

    const payload = jwtService.decode(result.access_token) as Record<string, unknown>;
    expect(payload.tenantId).toBe(tenant.id);
    expect(payload.isTenantAdmin).toBe(false);
    expect(payload.locations).toEqual([]);
    expect(payload.roles).toBeUndefined();
    expect(payload.features).toEqual([]);
    expect(result.features).toEqual([]);
  });

  it('should fail sign in (incorrect password)', async () => {
    await expect(
      service.signIn('loginUser', 'wrongPassword', tenant.id),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should fail sign in (no user)', async () => {
    await expect(
      service.signIn('nonExistingUser', 'wrongPassword', tenant.id),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should fail sign in (credentials belong to a different tenant)', async () => {
    await expect(
      service.signIn('loginUser', 'loginPassword', otherTenant.id),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('resolves effective features as tenant-enabled features intersected with the union of role grants', async () => {
    const location = await locationRepo.save({
      name: `${P}-location`,
      tenant,
    } as Location);
    const role = await roleRepo.save({ name: `${P}-role`, tenantId: tenant.id } as Role);

    await tenantFeatureRepo.save([
      { tenantId: tenant.id, feature: 'ORDER_MANAGEMENT' },
      { tenantId: tenant.id, feature: 'RECIPE_MANAGEMENT' },
    ] as TenantFeature[]);
    // Role only grants one of the tenant's two enabled features — proves
    // intersection, not a plain role-side union.
    await roleFeatureRepo.save({
      tenantId: tenant.id,
      roleId: role.id,
      feature: 'RECIPE_MANAGEMENT',
    } as RoleFeature);

    const dto = {
      name: `${P}-featureUser`,
      password: 'featurePassword',
      email: `${P}-featureUser@email.com`,
    } as CreateUserDto;
    const user = await userService.create(dto);
    if (!user) {
      throw new Error('insert user failed');
    }
    const assignment = await userLocationRepo.save({
      tenantId: tenant.id,
      locationId: location.id,
      user,
      roles: [role],
    } as UserLocation);

    const result = await service.signIn(dto.name, dto.password, tenant.id);
    const payload = jwtService.decode(result.access_token) as Record<string, unknown>;

    expect(payload.features).toEqual(['RECIPE_MANAGEMENT']);
    expect(result.features).toEqual(['RECIPE_MANAGEMENT']);

    await userLocationRepo.delete(assignment.id);
    await roleFeatureRepo.delete({ tenantId: tenant.id, roleId: role.id });
    await roleRepo.delete(role.id);
    await locationRepo.delete(location.id);
    await tenantFeatureRepo.delete({ tenantId: tenant.id });
  });

  it('isTenantAdmin bypasses role filtering, resolving effective features to the tenant full enabled set', async () => {
    const location = await locationRepo.save({
      name: `${P}-admin-location`,
      tenant,
    } as Location);
    // A role that grants neither of the tenant's enabled features — proves
    // the bypass ignores role grants entirely rather than happening to union
    // with them.
    const role = await roleRepo.save({ name: `${P}-admin-role`, tenantId: tenant.id } as Role);
    await roleFeatureRepo.save({
      tenantId: tenant.id,
      roleId: role.id,
      feature: 'ORDER_MANAGEMENT',
    } as RoleFeature);

    await tenantFeatureRepo.save([
      { tenantId: tenant.id, feature: 'INVENTORY_MANAGEMENT' },
      { tenantId: tenant.id, feature: 'LABEL_PRINTING' },
    ] as TenantFeature[]);

    const dto = {
      name: `${P}-adminUser`,
      password: 'adminPassword',
      email: `${P}-adminUser@email.com`,
      isTenantAdmin: true,
    } as CreateUserDto;
    const user = await userService.create(dto);
    if (!user) {
      throw new Error('insert user failed');
    }
    const assignment = await userLocationRepo.save({
      tenantId: tenant.id,
      locationId: location.id,
      user,
      roles: [role],
    } as UserLocation);

    const result = await service.signIn(dto.name, dto.password, tenant.id);
    const payload = jwtService.decode(result.access_token) as Record<string, unknown>;

    expect([...(payload.features as string[])].sort()).toEqual(
      ['INVENTORY_MANAGEMENT', 'LABEL_PRINTING'].sort(),
    );
    expect([...result.features].sort()).toEqual(['INVENTORY_MANAGEMENT', 'LABEL_PRINTING'].sort());

    await userLocationRepo.delete(assignment.id);
    await roleFeatureRepo.delete({ tenantId: tenant.id, roleId: role.id });
    await roleRepo.delete(role.id);
    await locationRepo.delete(location.id);
    await tenantFeatureRepo.delete({ tenantId: tenant.id });
  });
});
