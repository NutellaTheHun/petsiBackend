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
import { CreateUnitOfMeasureDto } from '../dto/unit-of-measure/create-unit-of-measure.dto';
import { UpdateUnitOfMeasureDto } from '../dto/unit-of-measure/update-unit-of-measure.dto';
import { UnitOfMeasureCategory } from '../entities/unit-of-measure-category.entity';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
import { UnitOfMeasureService } from '../services/unit-of-measure.service';
import {
    GRAM,
    PINT,
    POUND,
    VOLUME,
} from '../utils/constants';
import { unitOfMeasureToUpdateDto } from '../utils/entity-transformers/unit-of-measure.dto.transformer';
import { getUnitOfMeasureTestingModule } from '../utils/unit-of-measure-testing-module';
import { UnitOfMeasureTestingUtil } from '../utils/unit-of-measure-testing.util';
import { UnitOfMeasureController } from './unit-of-measure.controller';

describe('unit of measure controller', () => {
    let testingUtil: UnitOfMeasureTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: UnitOfMeasureController;
    let unitRepo: Repository<UnitOfMeasure>;
    let categoryRepo: Repository<UnitOfMeasureCategory>;

    beforeAll(async () => {
        module = await getUnitOfMeasureTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<UnitOfMeasureTestingUtil>(
            UnitOfMeasureTestingUtil,
        );
        await testingUtil.initUnitOfMeasureTestDatabase(dbTestContext);

        controller = module.get<UnitOfMeasureController>(UnitOfMeasureController);
        unitRepo = module.get(getRepositoryToken(UnitOfMeasure));
        categoryRepo = module.get(getRepositoryToken(UnitOfMeasureCategory));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns items aligned with repository', async () => {
        const repoRows = await unitRepo.find();
        const result = await controller.findAll(undefined, 100);
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with search filters by name', async () => {
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            'gram',
            undefined,
        );
        expect(result.items.length).toBeGreaterThan(0);
        expect(
            result.items.every((u) => u.name.toLowerCase().includes('gram')),
        ).toBe(true);
    });

    it('findAll with filter by category matches repository', async () => {
        const cat = await categoryRepo.findOne({ where: { name: VOLUME } });
        if (!cat) throw new Error('category not found');
        const repoResult = await unitRepo.find({
            where: { category: { id: cat.id } },
        });
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            undefined,
            [`category=${cat.id}`],
        );
        expect(result.items.length).toEqual(repoResult.length);
    });

    it('findAll with sortBy category returns non-empty list', async () => {
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            'category',
            'DESC',
            undefined,
            undefined,
        );
        expect(result.items.length).toBeGreaterThan(0);
    });

    it('findAll with sortBy name DESC matches repository ordering', async () => {
        const repoResult = await unitRepo.find({ order: { name: 'DESC' } });
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            'name',
            'DESC',
            undefined,
            undefined,
        );
        expect(result.items.length).toEqual(repoResult.length);
        if (repoResult.length > 0) {
            expect(result.items[0].name).toEqual(repoResult[0].name);
        }
    });

    it('findOne returns a seeded unit', async () => {
        const unit = await unitRepo.findOne({ where: { name: GRAM } });
        if (!unit) throw new Error('gram not found');
        const result = await controller.findOne(unit.id);
        expect(result.id).toEqual(unit.id);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('create persists a new unit', async () => {
        const cat = await categoryRepo.findOne({ where: { name: VOLUME } });
        if (!cat) throw new Error('category not found');
        const dto = plainToInstance(CreateUnitOfMeasureDto, {
            name: 'controller-uom-new',
            abbreviation: 'cun',
            conversionFactorToBase: '1',
            categoryId: cat.id,
        });
        const result = await controller.create(dto);
        expect(result.id).toBeDefined();
        const row = await unitRepo.findOne({ where: { name: dto.name } });
        expect(row).not.toBeNull();
    });

    it('create throws ValidationException when name already exists', async () => {
        const cat = await categoryRepo.findOne({ where: {} });
        if (!cat) throw new Error('category not found');
        const dto = plainToInstance(CreateUnitOfMeasureDto, {
            name: POUND,
            abbreviation: 'new',
            conversionFactorToBase: '1',
            categoryId: cat.id,
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

    it('update surfaces missing entity via DatabaseException', async () => {
        const dto = plainToInstance(UpdateUnitOfMeasureDto, {
            name: 'DoesNotMatter',
        });
        await expect(controller.update(9_999_999, dto)).rejects.toThrow(
            DatabaseException,
        );
    });

    describe('change detector on update', () => {
        let updateEntitySpy: jest.SpyInstance;

        beforeEach(() => {
            updateEntitySpy = jest.spyOn(
                UnitOfMeasureService.prototype as any,
                'updateEntity',
            );
        });

        afterEach(() => {
            updateEntitySpy.mockRestore();
        });

        it('skips updateEntity when DTO matches current unit', async () => {
            const unit = await unitRepo.findOne({
                where: { name: GRAM },
                relations: ['category'],
            });
            if (!unit) throw new Error('gram not found');
            const dto = unitOfMeasureToUpdateDto(unit);
            const result = await controller.update(unit.id, dto);
            expect(result.name).toEqual(unit.name);
            expect(updateEntitySpy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const unit = await unitRepo.findOne({
                where: { name: PINT },
                relations: ['category'],
            });
            if (!unit) throw new Error('pint not found');
            const newName = 'Pint Controller Renamed';
            const dto = unitOfMeasureToUpdateDto(unit, { name: newName });
            const result = await controller.update(unit.id, dto);
            expect(result.name).toEqual(newName);
            expect(updateEntitySpy).toHaveBeenCalled();
            const row = await unitRepo.findOne({ where: { id: unit.id } });
            expect(row!.name).toEqual(newName);
        });
    });

    it('remove deletes a created unit then findOne fails', async () => {
        const cat = await categoryRepo.findOne({ where: { name: VOLUME } });
        if (!cat) throw new Error('category not found');
        const created = await controller.create(
            plainToInstance(CreateUnitOfMeasureDto, {
                name: 'controller-uom-remove',
                abbreviation: 'cur',
                conversionFactorToBase: '1',
                categoryId: cat.id,
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
