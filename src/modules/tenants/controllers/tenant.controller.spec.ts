import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { Tenant } from '../entities/tenant.entity';
import { TenantTestUtil } from '../utils/tenant-test.util';
import { getTenantsTestingModule } from '../utils/tenants-testing.module';
import { TenantController } from './tenant.controller';

const P = `t${Date.now()}`;

describe('TenantController', () => {
    let testingUtil: TenantTestUtil;
    let testCtx: DatabaseTestContext;
    let controller: TenantController;
    let tenantRepo: Repository<Tenant>;

    let tenants: Tenant[];

    beforeAll(async () => {
        const module: TestingModule = await getTenantsTestingModule();
        testingUtil = module.get<TenantTestUtil>(TenantTestUtil);
        controller = module.get(TenantController);
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

    it('create throws ValidationException when subdomain already exists', async () => {
        const dto = plainToInstance(CreateTenantDto, {
            name: `${P}-controller-tenant`,
            subdomain: tenants[0].subdomain,
        });
        try {
            await controller.create(dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorSize(err.errors, 1);
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('ALREADY_EXISTS', undefined, [
                    'subdomain',
                ]),
            );
        }
    });

    it('remove deletes a created tenant then findOne fails', async () => {
        const created = await controller.create(
            plainToInstance(CreateTenantDto, {
                name: `${P}-controller-tenant-remove`,
                subdomain: `${P}-controller-subdomain-remove`,
            }),
        );
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(
            NotFoundException,
        );
    });
});
