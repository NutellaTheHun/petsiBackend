import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateLabelTypeDto } from '../dto/label-type/create-label-type.dto';
import { UpdateLabelTypeDto } from '../dto/label-type/update-label-type.dto';
import { LabelType } from '../entities/label-type.entity';
import { getLabelsTestingModule } from '../utils/label-testing.module';
import { LabelTestingUtil } from '../utils/label-testing.util';
import { LabelTypeValidator } from './label-type.validator';

const P = `t${Date.now()}`;

describe('label type validator', () => {
    let testingUtil: LabelTestingUtil;
    let testCtx: DatabaseTestContext;

    let validator: LabelTypeValidator;
    let typeRepo: Repository<LabelType>;

    let labelTypes: LabelType[];

    beforeAll(async () => {
        const module: TestingModule = await getLabelsTestingModule();
        testingUtil = module.get<LabelTestingUtil>(LabelTestingUtil);
        validator = module.get<LabelTypeValidator>(LabelTypeValidator);
        typeRepo = module.get(getRepositoryToken(LabelType));

        ({ labelTypes } = await testingUtil.seedLabelTypes(P));
    });

    afterAll(async () => {
        await typeRepo.delete(labelTypes.map((t) => t.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    // Create Validation Tests
    it('successfully validate create with no validation errors', async () => {
        const dto: CreateLabelTypeDto = plainToInstance(CreateLabelTypeDto, {
            name: `${P}-new-type`,
            length: 400,
            width: 200,
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateLabelTypeDto = plainToInstance(CreateLabelTypeDto, {
            name: labelTypes[0].name,
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
            name: `${P}-new-type`,
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
            name: `${P}-new-type`,
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
        const typeToUpdate = labelTypes[0];

        const dto: UpdateLabelTypeDto = plainToInstance(UpdateLabelTypeDto, {
            name: `${P}-type-updated`,
            length: 500,
            width: 300,
        });

        const errors = await validator.validateDto(dto, typeToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const typeToUpdate = labelTypes[0];
        const existingType = labelTypes[1];

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
        const typeToUpdate = labelTypes[0];

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
        const typeToUpdate = labelTypes[0];

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
