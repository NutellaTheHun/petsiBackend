import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateOrderCategoryDto } from '../dto/order-category/create-order-category.dto';
import { UpdateOrderCategoryDto } from '../dto/order-category/update-order-category.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderCategoryValidator } from './order-category.validator';

const P = `t${Date.now()}`;

describe('order category validator', () => {
    let testingUtil: OrderTestingUtil;
    let testCtx: DatabaseTestContext;

    let validator: OrderCategoryValidator;
    let categoryRepo: Repository<OrderCategory>;

    let categories: OrderCategory[];

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        validator = module.get<OrderCategoryValidator>(OrderCategoryValidator);
        categoryRepo = module.get(getRepositoryToken(OrderCategory));

        ({ categories } = await testingUtil.seedCategories(P));
    });

    afterAll(async () => {
        await categoryRepo.delete(categories.map((c) => c.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const dto: CreateOrderCategoryDto = plainToInstance(CreateOrderCategoryDto, {
            name: `${P}-new-category`,
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateOrderCategoryDto = plainToInstance(CreateOrderCategoryDto, {
            name: categories[0].name,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const dto: UpdateOrderCategoryDto = plainToInstance(UpdateOrderCategoryDto, {
            name: `${P}-updated-category`,
        });

        const errors = await validator.validateDto(dto, categories[0].id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const categoryToUpdate = categories[0];
        const existingCategory = categories[1];

        const dto: UpdateOrderCategoryDto = plainToInstance(UpdateOrderCategoryDto, {
            name: existingCategory.name,
        });

        const errors = await validator.validateDto(dto, categoryToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });
});
