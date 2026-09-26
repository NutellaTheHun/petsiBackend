import { JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/services/auth.service';
import { TenantFeature } from '../feature-flags/entities/tenant-feature.entity';
import { Location } from '../locations/entities/location.entity';
import { UserLocation } from '../locations/entities/user-location.entity';
import { Role } from '../roles/entities/role.entity';
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF } from '../roles/utils/constants';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entities';
import {
  ProvisionTenantResult,
  TenantProvisioningService,
} from './tenant-provisioning.service';
import { getTenantProvisioningTestingModule } from './utils/tenant-provisioning-testing.module';

const P = `t${Date.now()}`;

describe('TenantProvisioningService', () => {
  let service: TenantProvisioningService;
  let authService: AuthService;
  let jwtService: JwtService;

  let tenantRepo: Repository<Tenant>;
  let locationRepo: Repository<Location>;
  let roleRepo: Repository<Role>;
  let userRepo: Repository<User>;
  let userLocationRepo: Repository<UserLocation>;
  let tenantFeatureRepo: Repository<TenantFeature>;

  const provisionedTenantIds: number[] = [];

  beforeAll(async () => {
    const module: TestingModule = await getTenantProvisioningTestingModule();

    service = module.get<TenantProvisioningService>(TenantProvisioningService);
    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);

    tenantRepo = module.get(getRepositoryToken(Tenant));
    locationRepo = module.get(getRepositoryToken(Location));
    roleRepo = module.get(getRepositoryToken(Role));
    userRepo = module.get(getRepositoryToken(User));
    userLocationRepo = module.get(getRepositoryToken(UserLocation));
    tenantFeatureRepo = module.get(getRepositoryToken(TenantFeature));
  });

  afterAll(async () => {
    // FK-safe LIFO order: tenant features -> users -> roles -> locations -> tenants
    for (const tenantId of provisionedTenantIds) {
      await tenantFeatureRepo.delete({ tenantId });
      await userRepo.delete({ tenantId });
      await roleRepo.delete({ tenantId });
      await locationRepo.delete({ tenant: { id: tenantId } });
      await tenantRepo.delete(tenantId);
    }
  });

  describe('provisionTenant', () => {
    let result: ProvisionTenantResult;

    it('provisions a tenant, its first location, its role set, its enabled features, and a tenant-admin user in one call', async () => {
      result = await service.provisionTenant({
        tenantName: `${P}-tenant-a`,
        subdomain: `${P}-subdomain-a`,
        locationName: `${P}-location-a`,
        adminName: `${P}-owner`,
        adminPassword: 'ownerPass123',
        features: ['ORDER_MANAGEMENT', 'INVENTORY_MANAGEMENT'],
      });
      provisionedTenantIds.push(result.tenant.id);

      expect(result.tenant.id).toBeDefined();
      expect(result.location.id).toBeDefined();
      expect(result.roles.map((r) => r.name).sort()).toEqual(
        [ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF].sort(),
      );
      expect(result.adminUser.id).toBeDefined();
      expect(result.adminUser.isTenantAdmin).toBe(true);
      expect(result.tenantFeatures.map((f) => f.feature).sort()).toEqual(
        ['INVENTORY_MANAGEMENT', 'ORDER_MANAGEMENT'].sort(),
      );
    });

    it('persists a TenantFeature row per requested feature, scoped to the provisioned tenant', async () => {
      const rows = await tenantFeatureRepo.find({ where: { tenantId: result.tenant.id } });
      expect(rows.map((r) => r.feature).sort()).toEqual(
        ['INVENTORY_MANAGEMENT', 'ORDER_MANAGEMENT'].sort(),
      );
    });

    it('does not create a UserLocation row for the tenant-admin (isTenantAdmin alone grants every location)', async () => {
      const assignments = await userLocationRepo.find({
        where: { user: { id: result.adminUser.id } },
      });
      expect(assignments).toEqual([]);
    });

    it('lets the provisioned tenant-admin log in on the new tenant immediately', async () => {
      const loginResult = await authService.signIn(
        `${P}-owner`,
        'ownerPass123',
        result.tenant.id,
      );

      expect(loginResult.access_token).not.toBeNull();

      const payload = jwtService.decode(loginResult.access_token) as Record<string, unknown>;
      expect(payload.tenantId).toBe(result.tenant.id);
      expect(payload.isTenantAdmin).toBe(true);
      expect(payload.locations).toEqual([]);
    });

    it('rejects provisioning a second tenant with an already-used subdomain', async () => {
      await expect(
        service.provisionTenant({
          tenantName: `${P}-tenant-dup`,
          subdomain: `${P}-subdomain-a`,
          locationName: `${P}-location-dup`,
          adminName: `${P}-owner-dup`,
          adminPassword: 'ownerPass123',
        }),
      ).rejects.toThrow();
    });

    it('produces a fully isolated second tenant when run again with different details', async () => {
      const second = await service.provisionTenant({
        tenantName: `${P}-tenant-b`,
        subdomain: `${P}-subdomain-b`,
        locationName: `${P}-location-b`,
        // Same admin username as the first tenant, on purpose: name uniqueness
        // is per-tenant, so this must not collide.
        adminName: `${P}-owner`,
        adminPassword: 'ownerPass456',
      });
      provisionedTenantIds.push(second.tenant.id);

      expect(second.tenant.id).not.toBe(result.tenant.id);

      const firstRoleIds = new Set(result.roles.map((r) => r.id));
      for (const role of second.roles) {
        expect(firstRoleIds.has(role.id)).toBe(false);
      }

      const secondLogin = await authService.signIn(
        `${P}-owner`,
        'ownerPass456',
        second.tenant.id,
      );
      expect(secondLogin.access_token).not.toBeNull();
    });
  });
});
