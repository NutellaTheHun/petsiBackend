import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { DatabaseException } from '../../../common/exceptions/database-exception';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateOrderCategoryDto } from '../dto/order-category/create-order-category.dto';
import { UpdateOrderCategoryDto } from '../dto/order-category/update-order-category.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { TYPE_A, TYPE_D } from '../utils/constants';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderCategoryController } from './order-category.controller';

describe('order category controller', () => {
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: OrderCategoryController;
    let categoryRepo: Repository<OrderCategory>;

    beforeAll(async () => {
        module = await getOrdersTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        await testingUtil.initOrderCategoryTestDatabase(dbTestContext);

        controller = module.get<OrderCategoryController>(OrderCategoryController);
        categoryRepo = module.get(getRepositoryToken(OrderCategory));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns items aligned with repository', async () => {
        const repoRows = await categoryRepo.find();
        const result = await controller.findAll();
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with sortBy name DESC matches repository ordering', async () => {
        const repoResult = await categoryRepo.find({ order: { name: 'DESC' } });
        const result = await controller.findAll(
            undefined,
            undefined,
            undefined,
            'name',
            'DESC',
        );
        expect(result.items.length).toEqual(repoResult.length);
        if (repoResult.length > 0) {
            expect(result.items[0].name).toEqual(repoResult[0].name);
        }
    });

    it('findOne returns a seeded category', async () => {
        const cat = await categoryRepo.findOne({ where: { name: TYPE_A } });
        if (!cat) throw new Error('seed category not found');
        const result = await controller.findOne(cat.id);
        expect(result.id).toEqual(cat.id);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('create persists a new order category', async () => {
        const dto = plainToInstance(CreateOrderCategoryDto, {
            name: 'ControllerOrderCategoryNew',
        });
        const result = await controller.create(dto);
        expect(result.id).toBeDefined();
        const row = await categoryRepo.findOne({ where: { name: dto.name } });
        expect(row).not.toBeNull();
    });

    it('create throws ValidationException when name already exists', async () => {
        const dto = plainToInstance(CreateOrderCategoryDto, { name: TYPE_A });
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

    it('update throws ValidationException when name collides with another category', async () => {
        const categories = await categoryRepo.find();
        if (categories.length < 2) throw new Error('Not enough categories');

        const categoryToUpdate = categories[0];
        const existingCategory = categories[1];
        const dto = plainToInstance(UpdateOrderCategoryDto, {
            name: existingCategory.name,
        });
        try {
            await controller.update(categoryToUpdate.id, dto);
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

    it('update surfaces missing entity via DatabaseException', async () => {
        const dto = plainToInstance(UpdateOrderCategoryDto, {
            name: 'DoesNotMatter',
        });
        await expect(controller.update(9_999_999, dto)).rejects.toThrow(
            DatabaseException,
        );
    });

    it('update persists a name change', async () => {
        const cat = await categoryRepo.findOne({ where: { name: TYPE_D } });
        if (!cat) throw new Error('type d not found');
        const newName = 'type d controller renamed';
        const result = await controller.update(
            cat.id,
            plainToInstance(UpdateOrderCategoryDto, { name: newName }),
        );
        expect(result.name).toEqual(newName);
        const row = await categoryRepo.findOne({ where: { id: cat.id } });
        expect(row!.name).toEqual(newName);
    });

    it('remove deletes a created category then findOne fails', async () => {
        const created = await controller.create(
            plainToInstance(CreateOrderCategoryDto, {
                name: 'ControllerOrderCategoryRemove',
            }),
        );
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('remove throws NotFoundException when id does not exist', async () => {
        await expect(controller.remove(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });
});
