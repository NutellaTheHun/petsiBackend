import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { RoleBuilder } from '../builders/role.builder';
import { Role } from '../entities/role.entity';

@Injectable()
export class RoleTestUtil {
    constructor(
        @InjectRepository(Role)
        private readonly roleRepo: Repository<Role>,
        private readonly roleBuilder: RoleBuilder,

        @InjectRepository(Tenant)
        private readonly tenantRepo: Repository<Tenant>,
    ) { }

    /**
     * `Role` now requires a tenantId (NOT NULL). Most role fixtures don't
     * care about tenant scoping themselves — they only need a valid tenantId
     * to satisfy the column — so this lazily provisions (or reuses, by fixed
     * subdomain, across the whole test run) one shared fixture Tenant rather
     * than requiring every seed method's callers to plumb a tenantId
     * through. Tests that actually exercise tenant scoping seed and pass
     * their own explicit tenantId.
     */
    private static readonly DEFAULT_TENANT_SUBDOMAIN = 'role-test-util-fixture-tenant';
    private defaultTenantId?: number;
    public async getDefaultTenantId(): Promise<number> {
        if (this.defaultTenantId === undefined) {
            const existing = await this.tenantRepo.findOne({
                where: { subdomain: RoleTestUtil.DEFAULT_TENANT_SUBDOMAIN },
            });
            const tenant =
                existing ??
                (await this.tenantRepo.save({
                    name: 'Role Test Util Fixture Tenant',
                    subdomain: RoleTestUtil.DEFAULT_TENANT_SUBDOMAIN,
                }));
            this.defaultTenantId = tenant.id;
        }
        return this.defaultTenantId;
    }

    // ─── Atomic-prefix seed methods ─────────────────────────────────────────────
    // These do not register cleanup — callers are responsible for deleting by ID.

    public async seedRoles(P: string = '', tenantId?: number): Promise<{ tenantId: number; roles: Role[] }> {
        const effectiveTenantId = tenantId ?? (await this.getDefaultTenantId());

        const names = ['role-a', 'role-b', 'role-c'];
        const roles: Role[] = [];
        for (const name of names) {
            const entityName = P ? `${P}-${name}` : name;
            const entity = await this.roleBuilder
                .reset()
                .roleName(entityName)
                .tenantId(effectiveTenantId)
                .build();
            roles.push(await this.roleRepo.save(entity));
        }
        return { tenantId: effectiveTenantId, roles };
    }
}
