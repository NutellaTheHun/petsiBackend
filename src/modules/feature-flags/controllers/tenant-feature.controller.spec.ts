import { ForbiddenException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TenantFeature } from '../entities/tenant-feature.entity';
import { getFeatureFlagsTestingModule } from '../utils/feature-flags-testing-module';
import { TenantFeatureController } from './tenant-feature.controller';

const P = `t${Date.now()}`;

describe('TenantFeatureController', () => {
    let controller: TenantFeatureController;
    let requestContext: TestRequestContextService;
    let tenantRepo: Repository<Tenant>;
    let tenantFeatureRepo: Repository<TenantFeature>;

    let tenant: Tenant;
    let tenantFeature: TenantFeature;

    beforeAll(async () => {
        const module: TestingModule = await getFeatureFlagsTestingModule();
        controller = module.get(TenantFeatureController);
        requestContext = module.get(RequestContextService) as TestRequestContextService;
        tenantRepo = module.get(getRepositoryToken(Tenant));
        tenantFeatureRepo = module.get(getRepositoryToken(TenantFeature));

        tenant = await tenantRepo.save({ name: `${P}-tenant`, subdomain: `${P}-subdomain` });
        tenantFeature = await tenantFeatureRepo.save({
            tenantId: tenant.id,
            feature: 'ORDER_MANAGEMENT',
        } as TenantFeature);
    });

    afterAll(async () => {
        await tenantFeatureRepo.delete(tenantFeature.id);
        await tenantRepo.delete(tenant.id);
    });

    it('returns the caller tenant\'s enabled features when the caller is a tenant admin', async () => {
        requestContext.setContext({ tenantId: tenant.id, isTenantAdmin: true });
        const result = await controller.findEnabled();
        expect(result).toEqual(['ORDER_MANAGEMENT']);
    });

    it('rejects a non-tenant-admin caller', async () => {
        requestContext.setContext({ tenantId: tenant.id, isTenantAdmin: false });
        await expect(controller.findEnabled()).rejects.toThrow(ForbiddenException);
    });
});
