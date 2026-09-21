import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantFeature } from '../entities/tenant-feature.entity';
import { Feature } from '../utils/feature.registry';

/**
 * Intentionally not a `TenantScopedServiceBase`/`ControllerBase` subclass —
 * this is a single read used by (a) the login resolver and (b) the
 * tenant-admin read-only endpoint. `TenantFeature` writes happen exclusively
 * through `TenantProvisioningService`, which already bypasses the
 * `ServiceBase` stack for out-of-band tenant provisioning.
 */
@Injectable()
export class TenantFeatureService {
    constructor(
        @InjectRepository(TenantFeature)
        private readonly tenantFeatureRepo: Repository<TenantFeature>,
    ) {}

    async findEnabledFeatures(tenantId: number): Promise<Feature[]> {
        const rows = await this.tenantFeatureRepo.find({ where: { tenantId } });
        return rows.map((row) => row.feature);
    }
}
