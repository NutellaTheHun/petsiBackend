import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { Tenant } from '../entities/tenant.entity';
import { TenantTestUtil } from '../utils/tenant-test.util';
import { getTenantsTestingModule } from '../utils/tenants-testing.module';
import { TenantValidator } from './tenant.validator';

const P = `t${Date.now()}`;

describe('tenant validator', () => {
    let testingUtil: TenantTestUtil;
    let testCtx: DatabaseTestContext;

    let validator: TenantValidator;
    let tenantRepo: Repository<Tenant>;

    let tenants: Tenant[];

    beforeAll(async () => {
        const module: TestingModule = await getTenantsTestingModule();
        testingUtil = module.get<TenantTestUtil>(TenantTestUtil);
        validator = module.get<TenantValidator>(TenantValidator);
        tenantRepo = module.get(getRepositoryToken(Tenant));

        ({ tenants } = await testingUtil.seedTenants(P));
    });

    afterAll(async () => {
        await tenantRepo.delete(tenants.map((t) => t.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const dto: CreateTenantDto = plainToInstance(CreateTenantDto, {
            name: `${P}-new-tenant-name`,
            subdomain: `${P}-new-subdomain`,
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: subdomain already exists', async () => {
        const dto: CreateTenantDto = plainToInstance(CreateTenantDto, {
            name: `${P}-another-tenant-name`,
            subdomain: tenants[0].subdomain,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['subdomain']),
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const dto: UpdateTenantDto = plainToInstance(UpdateTenantDto, {
            name: `${P}-updated-tenant-name`,
            subdomain: `${P}-updated-subdomain`,
        });

        const errors = await validator.validateDto(dto, tenants[0].id);
        expect(errors).toBeNull();
    });

    it('fail validate update: subdomain already exists', async () => {
        const tenantToUpdate = tenants[0];
        const existingTenant = tenants[1];

        const dto: UpdateTenantDto = plainToInstance(UpdateTenantDto, {
            name: tenantToUpdate.name,
            subdomain: existingTenant.subdomain,
        });

        const errors = await validator.validateDto(dto, tenantToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['subdomain']),
        );
    });
});
