import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TenantFeature } from '../entities/tenant-feature.entity';
import { getFeatureFlagsTestingModule } from '../utils/feature-flags-testing-module';
import { TenantFeatureService } from './tenant-feature.service';

const P = `t${Date.now()}`;

describe('TenantFeature Service', () => {
    let tenantFeatureService: TenantFeatureService;
    let tenantFeatureRepo: Repository<TenantFeature>;
    let tenantRepo: Repository<Tenant>;

    let tenant: Tenant;
    let otherTenant: Tenant;
    let emptyTenant: Tenant;
    let tenantFeatures: TenantFeature[];
    let otherTenantFeature: TenantFeature;

    beforeAll(async () => {
        const module: TestingModule = await getFeatureFlagsTestingModule();
        tenantFeatureService = module.get(TenantFeatureService);
        tenantFeatureRepo = module.get(getRepositoryToken(TenantFeature));
        tenantRepo = module.get(getRepositoryToken(Tenant));

        tenant = await tenantRepo.save({ name: `${P}-tenant`, subdomain: `${P}-subdomain` });
        otherTenant = await tenantRepo.save({
            name: `${P}-other-tenant`,
            subdomain: `${P}-other-subdomain`,
        });
        emptyTenant = await tenantRepo.save({
            name: `${P}-empty-tenant`,
            subdomain: `${P}-empty-subdomain`,
        });

        tenantFeatures = await tenantFeatureRepo.save([
            { tenantId: tenant.id, feature: 'ORDER_MANAGEMENT' },
            { tenantId: tenant.id, feature: 'RECIPE_MANAGEMENT' },
        ] as TenantFeature[]);
        otherTenantFeature = await tenantFeatureRepo.save({
            tenantId: otherTenant.id,
            feature: 'LABEL_PRINTING',
        } as TenantFeature);
    });

    afterAll(async () => {
        await tenantFeatureRepo.delete([
            ...tenantFeatures.map((f) => f.id),
            otherTenantFeature.id,
        ]);
        await tenantRepo.delete([tenant.id, otherTenant.id, emptyTenant.id]);
    });

    it('returns the enabled features scoped to the requested tenant', async () => {
        const result = await tenantFeatureService.findEnabledFeatures(tenant.id);
        expect(result.sort()).toEqual(['ORDER_MANAGEMENT', 'RECIPE_MANAGEMENT'].sort());
    });

    it('does not include another tenant\'s enabled features', async () => {
        const result = await tenantFeatureService.findEnabledFeatures(tenant.id);
        expect(result).not.toContain('LABEL_PRINTING');
    });

    it('returns an empty array for a tenant with no enabled features', async () => {
        const result = await tenantFeatureService.findEnabledFeatures(emptyTenant.id);
        expect(result).toEqual([]);
    });
});
