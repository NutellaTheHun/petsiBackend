import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hashPassword } from '../auth/utils/hash';
import { TenantFeature } from '../feature-flags/entities/tenant-feature.entity';
import { Feature } from '../feature-flags/utils/feature.registry';
import { Location } from '../locations/entities/location.entity';
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF } from '../roles/utils/constants';
import { Role } from '../roles/entities/role.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entities';

export interface ProvisionTenantInput {
  tenantName: string;
  subdomain: string;
  locationName: string;
  locationAddress?: string;
  locationPhoneNumber?: string;
  locationEmail?: string;
  adminName: string;
  adminPassword: string;
  adminEmail?: string;
  features?: Feature[];
}

export interface ProvisionTenantResult {
  tenant: Tenant;
  location: Location;
  roles: Role[];
  adminUser: User;
  tenantFeatures: TenantFeature[];
}

/**
 * Provisions a brand-new tenant end-to-end: the `Tenant` row, its first
 * `Location`, its own `admin`/`manager`/`staff` `Role` rows, and a first
 * tenant-admin `User`. Writes go straight through the repositories rather
 * than the domain `ServiceBase`s, the same way `SeedService`
 * (`src/modules/seed/seed.service.ts`) seeds roles/users — `RoleService`/
 * `UserService` extend `TenantScopedServiceBase`, which stamps `tenantId`
 * from `RequestContextService`, and there is no request/CLS context to read
 * that from when this runs out-of-band via `NestFactory.createApplicationContext`.
 *
 * The provisioned admin user is `isTenantAdmin: true` and deliberately gets
 * no `UserLocation` row: per `LocationScopedServiceBase.isLocationAuthorized`,
 * `isTenantAdmin` alone grants access to every location under the tenant.
 */
@Injectable()
export class TenantProvisioningService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(TenantFeature)
    private readonly tenantFeatureRepo: Repository<TenantFeature>,
  ) {}

  async provisionTenant(input: ProvisionTenantInput): Promise<ProvisionTenantResult> {
    const existing = await this.tenantRepo.findOne({
      where: { subdomain: input.subdomain },
    });
    if (existing) {
      throw new Error(`A tenant with subdomain "${input.subdomain}" already exists.`);
    }

    const tenant = await this.tenantRepo.save({
      name: input.tenantName,
      subdomain: input.subdomain,
    });

    const location = await this.locationRepo.save({
      tenant,
      name: input.locationName,
      address: input.locationAddress ?? null,
      phoneNumber: input.locationPhoneNumber ?? null,
      email: input.locationEmail ?? null,
    });

    const roles: Role[] = [];
    for (const roleName of [ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF]) {
      roles.push(await this.roleRepo.save({ tenantId: tenant.id, name: roleName }));
    }

    const adminUser = await this.userRepo.save({
      tenantId: tenant.id,
      name: input.adminName,
      password: await hashPassword(input.adminPassword),
      email: input.adminEmail ?? null,
      isTenantAdmin: true,
    });

    const tenantFeatures: TenantFeature[] = [];
    for (const feature of input.features ?? []) {
      tenantFeatures.push(await this.tenantFeatureRepo.save({ tenantId: tenant.id, feature }));
    }

    return { tenant, location, roles, adminUser, tenantFeatures };
  }
}
