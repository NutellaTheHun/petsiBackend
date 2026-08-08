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
import { CreateInventoryItemVendorDto } from '../dto/inventory-item-vendor/create-inventory-item-vendor.dto';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemVendorController } from './inventory-item-vendor.controller';

const P = `t${Date.now()}`;

describe('Inventory Item Vendor Controller', () => {
    let testingUtil: InventoryItemTestingUtil;
    let testCtx: DatabaseTestContext;
    let controller: InventoryItemVendorController;
    let vendorRepo: Repository<InventoryItemVendor>;
    let tenantRepo: Repository<Tenant>;
    let requestContext: TestRequestContextService;

    let tenant: Tenant;
    let vendors: InventoryItemVendor[];

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule();
        testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
        controller = module.get<InventoryItemVendorController>(InventoryItemVendorController);
        vendorRepo = module.get(getRepositoryToken(InventoryItemVendor));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        requestContext = module.get(RequestContextService) as TestRequestContextService;

        tenant = await tenantRepo.save({ name: `${P}-tenant`, subdomain: `${P}-subdomain` });
        requestContext.setContext({ tenantId: tenant.id });

        ({ vendors } = await testingUtil.seedVendors(P, tenant.id));
    });

    afterAll(async () => {
        await vendorRepo.delete(vendors.map((v) => v.id));
        await tenantRepo.delete(tenant.id);
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    it('create throws ValidationException when name already exists', async () => {
        const dto = plainToInstance(CreateInventoryItemVendorDto, {
            name: vendors[0].name,
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

    it('remove deletes created vendor then findOne fails', async () => {
        const created = await controller.create(
            plainToInstance(CreateInventoryItemVendorDto, { name: `${P}-to-remove` }),
        );
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(NotFoundException);
    });
});
