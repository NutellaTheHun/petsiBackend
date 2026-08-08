import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';

@Injectable()
export class TenantTestUtil {
    constructor(
        @InjectRepository(Tenant)
        private readonly tenantRepo: Repository<Tenant>,
    ) { }

    // ─── Atomic-prefix seed methods ─────────────────────────────────────────────
    // These do not register cleanup — callers are responsible for deleting by ID.

    public async seedTenant(P: string): Promise<Tenant> {
        const entity = this.tenantRepo.create({
            name: `${P}-tenant`,
            subdomain: `${P}-subdomain`,
        });
        return await this.tenantRepo.save(entity);
    }

    public async seedTenants(P: string, count = 3): Promise<{ tenants: Tenant[] }> {
        const tenants: Tenant[] = [];
        for (let i = 0; i < count; i++) {
            const entity = this.tenantRepo.create({
                name: `${P}-tenant-${i}`,
                subdomain: `${P}-subdomain-${i}`,
            });
            tenants.push(await this.tenantRepo.save(entity));
        }
        return { tenants };
    }
}
