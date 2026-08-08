import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CreateInventoryItemPackageDto } from '../dto/inventory-item-package/create-inventory-item-package.dto';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemPackageController } from './inventory-item-package.controller';

const P = `t${Date.now()}`;

describe('Inventory Item Package Controller', () => {
    let testingUtil: InventoryItemTestingUtil;
    let testCtx: DatabaseTestContext;
    let controller: InventoryItemPackageController;
    let packageRepo: Repository<InventoryItemPackage>;
    let tenantRepo: Repository<Tenant>;
    let requestContext: TestRequestContextService;

    let tenant: Tenant;
    let packages: InventoryItemPackage[];

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule();
        testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
        controller = module.get<InventoryItemPackageController>(InventoryItemPackageController);
        packageRepo = module.get(getRepositoryToken(InventoryItemPackage));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        requestContext = module.get(RequestContextService) as TestRequestContextService;

        tenant = await tenantRepo.save({ name: `${P}-tenant`, subdomain: `${P}-subdomain` });
        requestContext.setContext({ tenantId: tenant.id });

        ({ packages } = await testingUtil.seedPackages(P, tenant.id));
    });

    afterAll(async () => {
        await packageRepo.delete(packages.map((p) => p.id));
        await tenantRepo.delete(tenant.id);
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    it('create throws ValidationException when name already exists', async () => {
        const dto = plainToInstance(CreateInventoryItemPackageDto, {
            name: packages[0].name,
        });
        try {
            await controller.create(dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
            );
        }
    });

    it('remove deletes created package then findOne fails', async () => {
        const created = await controller.create(
            plainToInstance(CreateInventoryItemPackageDto, { name: `${P}-to-remove` }),
        );
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(NotFoundException);
    });
});
