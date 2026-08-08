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
import { CreateInventoryItemCategoryDto } from '../dto/inventory-item-category/create-inventory-item-category.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemCategoryController } from './inventory-item-category.controller';

const P = `t${Date.now()}`;

describe('Inventory Item Category Controller', () => {
    let testingUtil: InventoryItemTestingUtil;
    let testCtx: DatabaseTestContext;
    let controller: InventoryItemCategoryController;
    let categoryRepo: Repository<InventoryItemCategory>;
    let tenantRepo: Repository<Tenant>;
    let requestContext: TestRequestContextService;

    let tenant: Tenant;
    let categories: InventoryItemCategory[];

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule();
        testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
        controller = module.get<InventoryItemCategoryController>(InventoryItemCategoryController);
        categoryRepo = module.get(getRepositoryToken(InventoryItemCategory));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        requestContext = module.get(RequestContextService) as TestRequestContextService;

        tenant = await tenantRepo.save({ name: `${P}-tenant`, subdomain: `${P}-subdomain` });
        requestContext.setContext({ tenantId: tenant.id });

        ({ categories } = await testingUtil.seedCategories(P, tenant.id));
    });

    afterAll(async () => {
        await categoryRepo.delete(categories.map((c) => c.id));
        await tenantRepo.delete(tenant.id);
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    it('create throws ValidationException when name already exists', async () => {
        const dto = plainToInstance(CreateInventoryItemCategoryDto, {
            name: categories[0].name,
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

    it('remove deletes created category then findOne fails', async () => {
        const created = await controller.create(
            plainToInstance(CreateInventoryItemCategoryDto, { name: `${P}-to-remove` }),
        );
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(NotFoundException);
    });
});
