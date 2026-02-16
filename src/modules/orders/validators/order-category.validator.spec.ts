import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateOrderCategoryDto } from '../dto/order-category/create-order-category.dto';
import { UpdateOrderCategoryDto } from '../dto/order-category/update-order-category.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { TYPE_A } from '../utils/constants';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderCategoryValidator } from './order-category.validator';

describe('order category validator', () => {
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: OrderCategoryValidator;
    let categoryRepo: Repository<OrderCategory>;

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        await testingUtil.initOrderCategoryTestDatabase(dbTestContext);

        validator = module.get<OrderCategoryValidator>(OrderCategoryValidator);

        categoryRepo = module.get(getRepositoryToken(OrderCategory));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined;
    });

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const dto: CreateOrderCategoryDto = {
            name: 'New Order Category',
        };

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateOrderCategoryDto = {
            name: TYPE_A,
        };

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', [], ['name']),
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const categoryToUpdate = await categoryRepo.findOne({
            where: { name: TYPE_A },
        });
        if (!categoryToUpdate) {
            throw new Error('category not found');
        }

        const dto: UpdateOrderCategoryDto = {
            name: 'Updated Order Category',
        };

        const errors = await validator.validateDto(
            dto,
            categoryToUpdate.id,
        );
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const categories = await categoryRepo.find();
        if (categories.length < 2) {
            throw new Error('Not enough categories for test');
        }

        const categoryToUpdate = categories[0];
        const existingCategory = categories[1];

        const dto: UpdateOrderCategoryDto = {
            name: existingCategory.name,
        };

        const errors = await validator.validateDto(
            dto,
            categoryToUpdate.id,
        );
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', [], ['name']),
        );
    });
});
