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
import { CreateLabelTypeDto } from '../dto/label-type/create-label-type.dto';
import { UpdateLabelTypeDto } from '../dto/label-type/update-label-type.dto';
import { LabelType } from '../entities/label-type.entity';
import { LabelTypeService } from '../services/label-type.service';
import { type_a, type_b, type_d } from '../utils/constants';
import { labelTypeToUpdateDto } from '../utils/entity-transformers/label-type.dto.transformer';
import { getLabelsTestingModule } from '../utils/label-testing.module';
import { LabelTestingUtil } from '../utils/label-testing.util';
import { LabelTypeController } from './label-type.controller';

describe('label type controller', () => {
    let testingUtil: LabelTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: LabelTypeController;
    let typeRepo: Repository<LabelType>;

    beforeAll(async () => {
        module = await getLabelsTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<LabelTestingUtil>(LabelTestingUtil);
        await testingUtil.initLabelTypeTestDatabase(dbTestContext);

        controller = module.get<LabelTypeController>(LabelTypeController);
        typeRepo = module.get(getRepositoryToken(LabelType));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns items aligned with repository', async () => {
        const repoRows = await typeRepo.find();
        const result = await controller.findAll();
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with sortBy name DESC matches repository ordering', async () => {
        const repoResult = await typeRepo.find({ order: { name: 'DESC' } });
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
            const lastIdx = repoResult.length - 1;
            expect(result.items[lastIdx].name).toEqual(repoResult[lastIdx].name);
        }
    });

    it('findOne returns a seeded label type', async () => {
        const labelType = await typeRepo.findOne({ where: { name: type_a } });
        if (!labelType) throw new Error('seed type not found');
        const result = await controller.findOne(labelType.id);
        expect(result.id).toEqual(labelType.id);
        expect(result.name).toEqual(type_a);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('create persists a new label type', async () => {
        const dto = plainToInstance(CreateLabelTypeDto, {
            name: 'ControllerLabelTypeNew',
            length: 450,
            width: 320,
        });
        const result = await controller.create(dto);
        expect(result.id).toBeDefined();
        const row = await typeRepo.findOne({ where: { name: dto.name } });
        expect(row).not.toBeNull();
        expect(row!.length).toEqual(dto.length);
    });

    it('create throws ValidationException when name already exists', async () => {
        const dto = plainToInstance(CreateLabelTypeDto, {
            name: type_a,
            length: 200,
            width: 400,
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

    it('update throws ValidationException when name collides with another type', async () => {
        const types = await typeRepo.find();
        if (types.length < 2) throw new Error('Not enough types for test');

        const typeToUpdate = types[0];
        const existingType = types[1];
        const dto = plainToInstance(UpdateLabelTypeDto, {
            name: existingType.name,
            length: typeToUpdate.length,
            width: typeToUpdate.width,
        });
        try {
            await controller.update(typeToUpdate.id, dto);
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
        const dto = plainToInstance(UpdateLabelTypeDto, {
            name: 'DoesNotMatter',
            length: 100,
            width: 100,
        });
        await expect(controller.update(9_999_999, dto)).rejects.toThrow(
            DatabaseException,
        );
    });

    describe('change detector on update', () => {
        let updateEntitySpy: jest.SpyInstance;

        beforeEach(() => {
            updateEntitySpy = jest.spyOn(
                LabelTypeService.prototype as any,
                'updateEntity',
            );
        });

        afterEach(() => {
            updateEntitySpy.mockRestore();
        });

        it('skips updateEntity when DTO matches current type', async () => {
            const labelType = await typeRepo.findOne({ where: { name: type_b } });
            if (!labelType) throw new Error('type b not found');
            const dto = labelTypeToUpdateDto(labelType);
            const result = await controller.update(labelType.id, dto);
            expect(result.name).toEqual(labelType.name);
            expect(updateEntitySpy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const labelType = await typeRepo.findOne({ where: { name: type_d } });
            if (!labelType) throw new Error('type d not found');
            const newName = 'type d controller renamed';
            const dto = labelTypeToUpdateDto(labelType, { name: newName });
            const result = await controller.update(labelType.id, dto);
            expect(result.name).toEqual(newName);
            expect(updateEntitySpy).toHaveBeenCalled();
            const row = await typeRepo.findOne({ where: { id: labelType.id } });
            expect(row!.name).toEqual(newName);
        });
    });

    it('remove deletes a created type then findOne fails', async () => {
        const created = await controller.create(
            plainToInstance(CreateLabelTypeDto, {
                name: 'ControllerLabelTypeRemove',
                length: 120,
                width: 240,
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
