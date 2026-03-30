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
import { CreateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/create-unit-of-measure-category.dto';
import { UpdateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/update-unit-of-measure-category.dto';
import { UnitOfMeasureCategory } from '../entities/unit-of-measure-category.entity';
import { UnitOfMeasureCategoryService } from '../services/unit-of-measure-category.service';
import { UNIT, VOLUME, WEIGHT } from '../utils/constants';
import { unitOfMeasureCategoryToUpdateDto } from '../utils/entity-transformers/unit-of-measure-category.dto.transformer';
import { getUnitOfMeasureTestingModule } from '../utils/unit-of-measure-testing-module';
import { UnitOfMeasureTestingUtil } from '../utils/unit-of-measure-testing.util';
import { UnitOfMeasureCategoryController } from './unit-of-measure-category.controller';

describe('unit of measure category controller', () => {
    let testingUtil: UnitOfMeasureTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: UnitOfMeasureCategoryController;
    let categoryRepo: Repository<UnitOfMeasureCategory>;

    beforeAll(async () => {
        module = await getUnitOfMeasureTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<UnitOfMeasureTestingUtil>(
            UnitOfMeasureTestingUtil,
        );
        await testingUtil.initUnitOfMeasureTestDatabase(dbTestContext);

        controller = module.get<UnitOfMeasureCategoryController>(
            UnitOfMeasureCategoryController,
        );
        categoryRepo = module.get(getRepositoryToken(UnitOfMeasureCategory));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns items aligned with repository', async () => {
        const repoRows = await categoryRepo.find();
        const result = await controller.findAll(undefined, 100);
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with sortBy name DESC matches repository ordering', async () => {
        const repoResult = await categoryRepo.find({ order: { name: 'DESC' } });
        const result = await controller.findAll(
            undefined,
            100,
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
        const cat = await categoryRepo.findOne({ where: { name: UNIT } });
        if (!cat) throw new Error('unit category not found');
        const result = await controller.findOne(cat.id);
        expect(result.id).toEqual(cat.id);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('create persists a new category', async () => {
        const dto = plainToInstance(CreateUnitOfMeasureCategoryDto, {
            name: 'ControllerUomCategoryNew',
            baseConversionUnitId: null,
        });
        const result = await controller.create(dto);
        expect(result.id).toBeDefined();
        const row = await categoryRepo.findOne({ where: { name: dto.name } });
        expect(row).not.toBeNull();
    });

    it('create throws ValidationException when name already exists', async () => {
        const dto = plainToInstance(CreateUnitOfMeasureCategoryDto, {
            name: UNIT,
            baseConversionUnitId: null,
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

    it('update throws ValidationException when name collides with another category', async () => {
        const categories = await categoryRepo.find({
            where: {},
            relations: ['baseConversionUnit'],
        });
        if (categories.length < 2) throw new Error('Not enough categories');

        const categoryToUpdate = categories[0];
        const existingCategory = categories[1];
        const dto = plainToInstance(UpdateUnitOfMeasureCategoryDto, {
            name: existingCategory.name,
            baseConversionUnitId: null,
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
        const dto = plainToInstance(UpdateUnitOfMeasureCategoryDto, {
            name: 'DoesNotMatter',
            baseConversionUnitId: null,
        });
        await expect(controller.update(9_999_999, dto)).rejects.toThrow(
            DatabaseException,
        );
    });

    describe('change detector on update', () => {
        let updateEntitySpy: jest.SpyInstance;

        beforeEach(() => {
            updateEntitySpy = jest.spyOn(
                UnitOfMeasureCategoryService.prototype as any,
                'updateEntity',
            );
        });

        afterEach(() => {
            updateEntitySpy.mockRestore();
        });

        it('skips updateEntity when DTO matches current category', async () => {
            const cat = await categoryRepo.findOne({
                where: { name: VOLUME },
                relations: ['baseConversionUnit'],
            });
            if (!cat) throw new Error('volume category not found');
            const dto = unitOfMeasureCategoryToUpdateDto(cat);
            const result = await controller.update(cat.id, dto);
            expect(result.name).toEqual(cat.name);
            expect(updateEntitySpy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const cat = await categoryRepo.findOne({
                where: { name: WEIGHT },
                relations: ['baseConversionUnit'],
            });
            if (!cat) throw new Error('weight category not found');
            const newName = 'Weight Controller Renamed';
            const dto = unitOfMeasureCategoryToUpdateDto(cat, { name: newName });
            const result = await controller.update(cat.id, dto);
            expect(result.name).toEqual(newName);
            expect(updateEntitySpy).toHaveBeenCalled();
            const row = await categoryRepo.findOne({ where: { id: cat.id } });
            expect(row!.name).toEqual(newName);
        });
    });

    it('remove deletes a created category then findOne fails', async () => {
        const created = await controller.create(
            plainToInstance(CreateUnitOfMeasureCategoryDto, {
                name: 'ControllerUomCategoryRemove',
                baseConversionUnitId: null,
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
