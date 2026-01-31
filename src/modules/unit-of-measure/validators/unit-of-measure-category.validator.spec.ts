import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { expectValidationErrorPayload } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/create-unit-of-measure-category.dto';
import { UpdateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/update-unit-of-measure-category.dto';
import { UnitOfMeasureCategory } from '../entities/unit-of-measure-category.entity';
import { UNIT } from '../utils/constants';
import { getUnitOfMeasureTestingModule } from '../utils/unit-of-measure-testing-module';
import { UnitOfMeasureTestingUtil } from '../utils/unit-of-measure-testing.util';
import { UnitOfMeasureCategoryValidator } from './unit-of-measure-category.validator';

describe('unit of measure category validator', () => {
    let testingUtil: UnitOfMeasureTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: UnitOfMeasureCategoryValidator;
    let categoryRepo: Repository<UnitOfMeasureCategory>;

    beforeAll(async () => {
        const module: TestingModule = await getUnitOfMeasureTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<UnitOfMeasureTestingUtil>(
            UnitOfMeasureTestingUtil,
        );
        await testingUtil.initUnitCategoryTestDatabase(dbTestContext);

        validator = module.get<UnitOfMeasureCategoryValidator>(
            UnitOfMeasureCategoryValidator,
        );

        categoryRepo = module.get(getRepositoryToken(UnitOfMeasureCategory));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined;
    });

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const dto: CreateUnitOfMeasureCategoryDto = {
            name: 'New Category',
        };

        const errors = await validator.validateCreateNode(dto);
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateUnitOfMeasureCategoryDto = {
            name: UNIT,
        };

        const errors = await validator.validateCreateNode(dto);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'name' }],
            'Category with this name already exists.',
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const categoryToUpdate = await categoryRepo.findOne({
            where: { name: UNIT },
        });
        if (!categoryToUpdate) {
            throw new Error('category not found');
        }

        const dto: UpdateUnitOfMeasureCategoryDto = {
            name: 'Updated Category',
        };

        const errors = await validator.validateUpdateNode(
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

        const dto: UpdateUnitOfMeasureCategoryDto = {
            name: existingCategory.name,
        };

        const errors = await validator.validateUpdateNode(
            dto,
            categoryToUpdate.id,
        );
        expectValidationErrorPayload(
            errors,
            [{ prop: 'name' }],
            'Category with this name already exists.',
        );
    });
});
