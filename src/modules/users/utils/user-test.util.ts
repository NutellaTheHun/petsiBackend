import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { UserBuilder } from '../builders/user.builder';
import { User } from '../entities/user.entities';

@Injectable()
export class UserTestUtil {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly userBuilder: UserBuilder,

        @InjectRepository(Tenant)
        private readonly tenantRepo: Repository<Tenant>,
    ) { }

    /**
     * `User` now requires a tenantId (NOT NULL). Most user fixtures don't
     * care about tenant scoping themselves — they only need a valid tenantId
     * to satisfy the column — so this lazily provisions (or reuses, by fixed
     * subdomain, across the whole test run) one shared fixture Tenant rather
     * than requiring every seed method's callers to plumb a tenantId
     * through. Tests that actually exercise tenant scoping seed and pass
     * their own explicit tenantId.
     */
    private static readonly DEFAULT_TENANT_SUBDOMAIN = 'user-test-util-fixture-tenant';
    private defaultTenantId?: number;
    public async getDefaultTenantId(): Promise<number> {
        if (this.defaultTenantId === undefined) {
            const existing = await this.tenantRepo.findOne({
                where: { subdomain: UserTestUtil.DEFAULT_TENANT_SUBDOMAIN },
            });
            const tenant =
                existing ??
                (await this.tenantRepo.save({
                    name: 'User Test Util Fixture Tenant',
                    subdomain: UserTestUtil.DEFAULT_TENANT_SUBDOMAIN,
                }));
            this.defaultTenantId = tenant.id;
        }
        return this.defaultTenantId;
    }

    // ─── Atomic-prefix seed methods ─────────────────────────────────────────────
    // These do not register cleanup — callers are responsible for deleting by ID.

    public async seedUsers(P: string = '', tenantId?: number): Promise<{ tenantId: number; users: User[] }> {
        const effectiveTenantId = tenantId ?? (await this.getDefaultTenantId());

        const names = ['user-a', 'user-b', 'user-c', 'user-d', 'user-e'];
        const users: User[] = [];
        for (let i = 0; i < names.length; i++) {
            const entityName = P ? `${P}-${names[i]}` : names[i];
            const entity = await this.userBuilder
                .reset()
                .email(`${entityName}@example.com`)
                .password(`password${i}`)
                .name(entityName)
                .tenantId(effectiveTenantId)
                .build();
            users.push(await this.userRepo.save(entity));
        }
        return { tenantId: effectiveTenantId, users };
    }
}
