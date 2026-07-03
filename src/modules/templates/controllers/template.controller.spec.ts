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
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { Template } from '../entities/template.entity';
import { getTemplateTestingModule } from '../utils/template-testing.module';
import { TemplateTestingUtil } from '../utils/template-testing.util';
import { TemplateController } from './template.controller';

const P = `t${Date.now()}`;

describe('template controller', () => {
    let testingUtil: TemplateTestingUtil;
    let testCtx: DatabaseTestContext;
    let controller: TemplateController;
    let templateRepo: Repository<Template>;

    let templates: Template[];

    beforeAll(async () => {
        const module: TestingModule = await getTemplateTestingModule();
        testingUtil = module.get<TemplateTestingUtil>(TemplateTestingUtil);
        controller = module.get<TemplateController>(TemplateController);
        templateRepo = module.get(getRepositoryToken(Template));

        ({ templates } = await testingUtil.seedTemplates(P));
    });

    afterAll(async () => {
        await templateRepo.delete(templates.map((t) => t.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    it('create throws ValidationException when name already exists', async () => {
        const dto = plainToInstance(CreateTemplateDto, { name: templates[0].name });
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
                createValidationErrorPayload('ALREADY_EXISTS', undefined, [
                    'name',
                ]),
            );
        }
    });

    it('remove deletes a template then findOne fails', async () => {
        const dto = plainToInstance(CreateTemplateDto, {
            name: `${P}-to-remove`,
        });
        const created = await controller.create(dto);
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(
            NotFoundException,
        );
    });
});
