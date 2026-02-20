import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateLabelTypeDto } from '../dto/label-type/create-label-type.dto';
import { UpdateLabelTypeDto } from '../dto/label-type/update-label-type.dto';
import { LabelType } from '../entities/label-type.entity';
import { type_a } from '../utils/constants';
import { getLabelsTestingModule } from '../utils/label-testing.module';
import { LabelTestingUtil } from '../utils/label-testing.util';
import { LabelTypeValidator } from './label-type.validator';

describe('label type validator', () => {
    let testingUtil: LabelTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: LabelTypeValidator;
    let typeRepo: Repository<LabelType>;

    beforeAll(async () => {
        const module: TestingModule = await getLabelsTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<LabelTestingUtil>(LabelTestingUtil);
        await testingUtil.initLabelTypeTestDatabase(dbTestContext);

        validator = module.get<LabelTypeValidator>(LabelTypeValidator);

        typeRepo = module.get(getRepositoryToken(LabelType));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined;
    });

    // Create Validation Tests
    it('successfully validate create with no validation errors', async () => {
        const dto: CreateLabelTypeDto = plainToInstance(CreateLabelTypeDto, {
            name: 'New Label Type',
            length: 400,
            width: 200,
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateLabelTypeDto = plainToInstance(CreateLabelTypeDto, {
            name: type_a,
            length: 400,
            width: 200,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('fail validate create: length with value 0', async () => {
        const dto: CreateLabelTypeDto = plainToInstance(CreateLabelTypeDto, {
            name: 'New Label Type',
            length: 0,
            width: 200,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['length']),
        );
    });

    it('fail validate create: width with value 0', async () => {
        const dto: CreateLabelTypeDto = plainToInstance(CreateLabelTypeDto, {
            name: 'New Label Type',
            length: 400,
            width: 0,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['width']),
        );
    });

    // Update Validation Tests
    it('successfully validate update with no validation errors', async () => {
        const typeToUpdate = await typeRepo.findOne({ where: { name: type_a } });
        if (!typeToUpdate) {
            throw new Error('type not found');
        }

        const dto: UpdateLabelTypeDto = plainToInstance(UpdateLabelTypeDto, {
            name: 'Updated Label Type',
            length: 500,
            width: 300,
        });

        const errors = await validator.validateDto(dto, typeToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const types = await typeRepo.find();
        if (types.length < 2) {
            throw new Error('Not enough types for test');
        }

        const typeToUpdate = types[0];
        const existingType = types[1];

        const dto: UpdateLabelTypeDto = plainToInstance(UpdateLabelTypeDto, {
            name: existingType.name,
            length: typeToUpdate.length,
            width: typeToUpdate.width,
        });

        const errors = await validator.validateDto(dto, typeToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('fail validate update: length with value 0', async () => {
        const typeToUpdate = await typeRepo.findOne({ where: { name: type_a } });
        if (!typeToUpdate) {
            throw new Error('type not found');
        }

        const dto: UpdateLabelTypeDto = plainToInstance(UpdateLabelTypeDto, {
            length: 0,
            width: typeToUpdate.width,
            name: typeToUpdate.name,
        });

        const errors = await validator.validateDto(dto, typeToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['length']),
        );
    });

    it('fail validate update: width with value 0', async () => {
        const typeToUpdate = await typeRepo.findOne({ where: { name: type_a } });
        if (!typeToUpdate) {
            throw new Error('type not found');
        }

        const dto: UpdateLabelTypeDto = plainToInstance(UpdateLabelTypeDto, {
            width: 0,
            length: typeToUpdate.length,
            name: typeToUpdate.name,
        });

        const errors = await validator.validateDto(dto, typeToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['width']),
        );
    });
});
