import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Location } from '../entities/location.entity';

@Injectable()
export class LocationTestUtil {
    constructor(
        @InjectRepository(Location)
        private readonly locationRepo: Repository<Location>,

        @InjectRepository(Tenant)
        private readonly tenantRepo: Repository<Tenant>,
    ) { }

    // ─── Atomic-prefix seed methods ─────────────────────────────────────────────
    // These do not register cleanup — callers are responsible for deleting by ID.

    public async seedTenant(P: string): Promise<Tenant> {
        const entity = this.tenantRepo.create({
            name: `${P}-location-tenant`,
            subdomain: `${P}-location-subdomain`,
        });
        return await this.tenantRepo.save(entity);
    }

    public async seedLocations(
        P: string,
        tenant?: Tenant,
        count = 3,
    ): Promise<{ tenant: Tenant; locations: Location[] }> {
        const resolvedTenant = tenant ?? (await this.seedTenant(P));

        const locations: Location[] = [];
        for (let i = 0; i < count; i++) {
            const entity = this.locationRepo.create({
                tenant: resolvedTenant,
                name: `${P}-location-${i}`,
                address: `${i} Test St`,
                phoneNumber: '555-000-0000',
                email: `${P}-location-${i}@example.com`,
            });
            locations.push(await this.locationRepo.save(entity));
        }
        return { tenant: resolvedTenant, locations };
    }
}
