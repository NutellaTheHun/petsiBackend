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
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CreateOrderCategoryDto } from '../dto/order-category/create-order-category.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderCategoryService } from '../services/order-category.service';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderCategoryController } from './order-category.controller';

const P = `t${Date.now()}`;

describe('order category controller', () => {
    let testingUtil: OrderTestingUtil;
    let testCtx: DatabaseTestContext;
    let controller: OrderCategoryController;
    let service: OrderCategoryService;
    let categoryRepo: Repository<OrderCategory>;
    let tenantRepo: Repository<Tenant>;
    let requestContext: TestRequestContextService;

    let tenant: Tenant;
    let otherTenant: Tenant;
    let categories: OrderCategory[];

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        controller = module.get<OrderCategoryController>(OrderCategoryController);
        service = module.get<OrderCategoryService>(OrderCategoryService);
        categoryRepo = module.get(getRepositoryToken(OrderCategory));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        requestContext = module.get(RequestContextService) as TestRequestContextService;

        tenant = await tenantRepo.save({ name: `${P}-tenant`, subdomain: `${P}-subdomain` });
        otherTenant = await tenantRepo.save({
            name: `${P}-other-tenant`,
            subdomain: `${P}-other-subdomain`,
        });
        requestContext.setContext({ tenantId: tenant.id });

        ({ categories } = await testingUtil.seedCategories(P, tenant.id));
    });

    afterAll(async () => {
        await categoryRepo.delete(categories.map((c) => c.id));
        await tenantRepo.delete([tenant.id, otherTenant.id]);
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
        requestContext.setContext({ tenantId: tenant.id });
    });

    it('create throws ValidationException when name already exists', async () => {
        const dto = plainToInstance(CreateOrderCategoryDto, {
            name: categories[0].name,
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
                createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
            );
        }
    });

    it('remove deletes a category then findOne fails', async () => {
        const created = await controller.create(
            plainToInstance(CreateOrderCategoryDto, {
                name: `${P}-to-remove`,
            }),
        );
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(
            NotFoundException,
        );
    });

    describe('tenant-scoped caching', () => {
        it('findOne cache does not leak across tenants for the same id', async () => {
            requestContext.setContext({ tenantId: tenant.id });
            const cached = await controller.findOne(categories[0].id);
            expect(cached.id).toBe(categories[0].id);

            requestContext.setContext({ tenantId: otherTenant.id });
            await expect(controller.findOne(categories[0].id)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('findAll cache does not leak across tenants for the same query', async () => {
            requestContext.setContext({ tenantId: tenant.id });
            const ownResult = await controller.findAll(undefined, 100);
            expect(
                ownResult.items.find((c) => c.id === categories[0].id),
            ).toBeDefined();

            requestContext.setContext({ tenantId: otherTenant.id });
            const otherResult = await controller.findAll(undefined, 100);
            expect(
                otherResult.items.find((c) => c.id === categories[0].id),
            ).toBeUndefined();
        });

        it('create invalidates only the writing tenant\'s findAll cache', async () => {
            requestContext.setContext({ tenantId: otherTenant.id });
            await controller.findAll(undefined, 100); // primes otherTenant's findAll cache

            const findAllSpy = jest.spyOn(service, 'findAll');

            requestContext.setContext({ tenantId: tenant.id });
            const created = await controller.create(
                plainToInstance(CreateOrderCategoryDto, {
                    name: `${P}-invalidation-check`,
                }),
            );

            requestContext.setContext({ tenantId: otherTenant.id });
            await controller.findAll(undefined, 100); // should still be a cache hit
            expect(findAllSpy).not.toHaveBeenCalled();

            findAllSpy.mockRestore();
            requestContext.setContext({ tenantId: tenant.id });
            await categoryRepo.delete(created.id);
        });
    });
});
