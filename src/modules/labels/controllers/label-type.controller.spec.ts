import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateLabelTypeDto } from '../dto/label-type/create-label-type.dto';
import { LabelType } from '../entities/label-type.entity';
import { getLabelsTestingModule } from '../utils/label-testing.module';
import { LabelTestingUtil } from '../utils/label-testing.util';
import { LabelTypeController } from './label-type.controller';

const P = `t${Date.now()}`;

describe('label type controller', () => {
    let testingUtil: LabelTestingUtil;
    let testCtx: DatabaseTestContext;
    let controller: LabelTypeController;
    let typeRepo: Repository<LabelType>;

    let labelTypes: LabelType[];

    beforeAll(async () => {
        const module: TestingModule = await getLabelsTestingModule();
        testingUtil = module.get<LabelTestingUtil>(LabelTestingUtil);
        controller = module.get<LabelTypeController>(LabelTypeController);
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

    it('create throws ValidationException when name already exists', async () => {
        const dto = plainToInstance(CreateLabelTypeDto, {
            name: labelTypes[0].name,
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

    it('remove deletes a type then findOne fails', async () => {
        const dto = plainToInstance(CreateLabelTypeDto, {
            name: `${P}-to-remove`,
            length: 120,
            width: 240,
        });
        const created = await controller.create(dto);
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(
            NotFoundException,
        );
    });
});
