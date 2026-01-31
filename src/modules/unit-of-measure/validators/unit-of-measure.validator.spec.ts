import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { expectValidationErrorPayload } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateUnitOfMeasureDto } from '../dto/unit-of-measure/create-unit-of-measure.dto';
import { UpdateUnitOfMeasureDto } from '../dto/unit-of-measure/update-unit-of-measure.dto';
import { UnitOfMeasureCategory } from '../entities/unit-of-measure-category.entity';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
import { POUND, POUND_ABBREV } from '../utils/constants';
import { getUnitOfMeasureTestingModule } from '../utils/unit-of-measure-testing-module';
import { UnitOfMeasureTestingUtil } from '../utils/unit-of-measure-testing.util';
import { UnitOfMeasureValidator } from './unit-of-measure.validator';

describe('unit of measure validator', () => {
    let testingUtil: UnitOfMeasureTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: UnitOfMeasureValidator;
    let unitRepo: Repository<UnitOfMeasure>;
    let categoryRepo: Repository<UnitOfMeasureCategory>;

    beforeAll(async () => {
        const module: TestingModule = await getUnitOfMeasureTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<UnitOfMeasureTestingUtil>(
            UnitOfMeasureTestingUtil,
        );
        await testingUtil.initUnitOfMeasureTestDatabase(dbTestContext);

        validator = module.get<UnitOfMeasureValidator>(UnitOfMeasureValidator);

        unitRepo = module.get(getRepositoryToken(UnitOfMeasure));
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
        const category = await categoryRepo.findOne({});
        if (!category) {
            throw new Error('category not found');
        }

        const dto: CreateUnitOfMeasureDto = {
            name: 'New Unit',
            abbreviation: 'nu',
            conversionFactorToBase: '1.5',
            categoryId: category.id,
        };

        const errors = await validator.validateCreateNode(dto);
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const category = await categoryRepo.findOne({});
        if (!category) {
            throw new Error('category not found');
        }

        const dto: CreateUnitOfMeasureDto = {
            name: POUND,
            abbreviation: 'new',
            categoryId: category.id,
        };

        const errors = await validator.validateCreateNode(dto);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'name' }],
            'Unit of measure with this name already exists.',
        );
    });

    it('fail validate create: abbreviation already exists', async () => {
        const category = await categoryRepo.findOne({});
        if (!category) {
            throw new Error('category not found');
        }

        const dto: CreateUnitOfMeasureDto = {
            name: 'New Unit',
            abbreviation: POUND_ABBREV,
            categoryId: category.id,
        };

        const errors = await validator.validateCreateNode(dto);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'abbreviation' }],
            'abbreviation with this name already exists.',
        );
    });

    it('fail validate create: conversion factor cannot be 0', async () => {
        const category = await categoryRepo.findOne({});
        if (!category) {
            throw new Error('category not found');
        }

        const dto: CreateUnitOfMeasureDto = {
            name: 'New Unit',
            abbreviation: 'nu',
            conversionFactorToBase: '0',
            categoryId: category.id,
        };

        const errors = await validator.validateCreateNode(dto);
        // Note: enforcePositive may convert string to number, testing with "0" string
        expectValidationErrorPayload(
            errors,
            [{ prop: 'conversionFactorToBase' }],
            'conversion factor cannot be 0',
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const unitToUpdate = await unitRepo.findOne({ where: { name: POUND } });
        if (!unitToUpdate) {
            throw new Error('unit not found');
        }

        const dto: UpdateUnitOfMeasureDto = {
            name: 'Updated Unit',
            abbreviation: 'uu',
            conversionFactorToBase: '2.5',
        };

        const errors = await validator.validateUpdateNode(dto, unitToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const units = await unitRepo.find();
        if (units.length < 2) {
            throw new Error('Not enough units for test');
        }

        const unitToUpdate = units[0];
        const existingUnit = units[1];

        const dto: UpdateUnitOfMeasureDto = {
            name: existingUnit.name,
        };

        const errors = await validator.validateUpdateNode(dto, unitToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'name' }],
            'Unit of measure with this name already exists.',
        );
    });

    it('fail validate update: abbreviation already exists', async () => {
        const units = await unitRepo.find();
        if (units.length < 2) {
            throw new Error('Not enough units for test');
        }

        const unitToUpdate = units[0];
        const existingUnit = units[1];

        const dto: UpdateUnitOfMeasureDto = {
            abbreviation: existingUnit.abbreviation,
        };

        const errors = await validator.validateUpdateNode(dto, unitToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'abbreviation' }],
            'abbreviation with this name already exists.',
        );
    });

    it('fail validate update: conversion factor cannot be 0', async () => {
        const unitToUpdate = await unitRepo.findOne({ where: { name: POUND } });
        if (!unitToUpdate) {
            throw new Error('unit not found');
        }

        const dto: UpdateUnitOfMeasureDto = {
            conversionFactorToBase: '0',
        };

        const errors = await validator.validateUpdateNode(dto, unitToUpdate.id);
        expectValidationErrorPayload(
            errors,
            [{ prop: 'conversionFactorToBase' }],
            'conversion factor must be greater than 0',
        );
    });
});
