import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
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
        const dto: CreateUnitOfMeasureCategoryDto = plainToInstance(CreateUnitOfMeasureCategoryDto, {
            name: 'New Category',
            baseConversionUnitId: null,
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateUnitOfMeasureCategoryDto = plainToInstance(CreateUnitOfMeasureCategoryDto, {
            name: UNIT,
            baseConversionUnitId: null,
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
            where: { name: UNIT },
            relations: ['baseConversionUnit'],
        });
        if (!categoryToUpdate) {
            throw new Error('category not found');
        }

        const dto: UpdateUnitOfMeasureCategoryDto = plainToInstance(UpdateUnitOfMeasureCategoryDto, {
            name: 'Updated Category',
            baseConversionUnitId: null,
        });

        const errors = await validator.validateDto(
            dto,
            categoryToUpdate.id,
        );
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const categories = await categoryRepo.find({ where: {}, relations: ['baseConversionUnit'] });
        if (categories.length < 2) {
            throw new Error('Not enough categories for test');
        }


        const categoryToUpdate = categories[0];
        const existingCategory = categories[1];

        const dto: UpdateUnitOfMeasureCategoryDto = plainToInstance(UpdateUnitOfMeasureCategoryDto, {
            name: existingCategory.name,
            baseConversionUnitId: null,
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
