import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryItemCategoryDto } from '../dto/inventory-item-category/create-inventory-item-category.dto';
import { UpdateInventoryItemCategoryDto } from '../dto/inventory-item-category/update-inventory-item-category.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { FOOD_CAT } from '../utils/constants';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemCategoryValidator } from './inventory-item-category.validator';

describe('inventory item category validator', () => {
    let testingUtil: InventoryItemTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: InventoryItemCategoryValidator;
    let categoryRepo: Repository<InventoryItemCategory>;

    beforeAll(async () => {
        const module: TestingModule = await getInventoryItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<InventoryItemTestingUtil>(
            InventoryItemTestingUtil,
        );
        await testingUtil.initInventoryItemCategoryTestDatabase(dbTestContext);

        validator = module.get<InventoryItemCategoryValidator>(
            InventoryItemCategoryValidator,
        );

        categoryRepo = module.get(getRepositoryToken(InventoryItemCategory));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined;
    });

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const dto: CreateInventoryItemCategoryDto = plainToInstance(CreateInventoryItemCategoryDto, {
            name: 'New Category Name',
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateInventoryItemCategoryDto = plainToInstance(CreateInventoryItemCategoryDto, {
            name: FOOD_CAT,
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
        const categoryToUpdate = await categoryRepo.findOne({
            where: { name: FOOD_CAT },
        });
        if (!categoryToUpdate) {
            throw new Error('category not found');
        }

        const dto: UpdateInventoryItemCategoryDto = plainToInstance(UpdateInventoryItemCategoryDto, {
            name: 'Updated Category Name',
        });

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

        const dto: UpdateInventoryItemCategoryDto = plainToInstance(UpdateInventoryItemCategoryDto, {
            name: existingCategory.name,
        });

        const errors = await validator.validateDto(
            dto,
            categoryToUpdate.id,
        );
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });
});
