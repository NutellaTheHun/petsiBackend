import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { UpdateTemplateDto } from '../dto/template/update-template.dto';
import { Template } from '../entities/template.entity';
import { TemplateService } from '../services/template.service';
import { getTestTemplateNames } from '../utils/constants';
import { getTemplateTestingModule } from '../utils/template-testing.module';
import { TemplateController } from './template.controller';

describe('TemplatesController', () => {
    let controller: TemplateController;
    let service: TemplateService;

    let templates: Template[];
    let templateId = 1;

    let testId: number;

    beforeAll(async () => {
        const module: TestingModule = await getTemplateTestingModule();

        controller = module.get<TemplateController>(TemplateController);
        service = module.get<TemplateService>(TemplateService);

        const templateNames = getTestTemplateNames();
        templates = templateNames.map(name => ({
            id: templateId++,
            templateName: name,
        }) as Template);

        jest.spyOn(service, 'create').mockImplementation(async (dto: CreateTemplateDto) => {
            const exists = templates.find(temp => temp.templateName === dto.templateName);
            if (exists) { throw new BadRequestException(); }

            const template = {
                id: templateId++,
                templateName: dto.templateName,
            } as Template;

            templates.push(template);
            return template;
        });

        jest.spyOn(service, 'findAll').mockResolvedValue({ items: templates });

        jest.spyOn(service, 'findEntitiesById').mockImplementation(async (ids: number[]) => {
            return templates.filter(temp => ids.findIndex(id => id === temp.id) !== -1);
        });

        jest.spyOn(service, 'findOne').mockImplementation(async (id?: number) => {
            const result = templates.find(temp => temp.id === id);
            if (!result) {
                throw new NotFoundException();
            }
            return result;
        });

        jest.spyOn(service, 'findOneByName').mockImplementation(async (name: string) => {
            return templates.find(temp => temp.templateName === name) || null;
        });

        jest.spyOn(service, 'remove').mockImplementation(async (id: number) => {
            const index = templates.findIndex(temp => temp.id === id);
            if (index === -1) { return false; }

            templates.splice(index, 1);
            return true;
        });

        jest.spyOn(service, 'update').mockImplementation(async (id: number, dto: UpdateTemplateDto) => {
            const existIdx = templates.findIndex(temp => temp.id === id);
            if (existIdx === -1) { throw new NotFoundException(); }

            if (dto.templateName) {
                templates[existIdx].templateName = dto.templateName;
            }

            return templates[existIdx];
        });
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should create a template', async () => {
        const dto = {
            templateName: "testTemplate",
        } as CreateTemplateDto;

        const result = await controller.create(dto);

        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull()
        expect(result?.templateName).toEqual("testTemplate");

        testId = result?.id as number;
    });

    it('should fail to create a template (already exists)', async () => {
        const dto = {
            templateName: "testTemplate",
        } as CreateTemplateDto;

        await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should find template by id', async () => {
        const result = await controller.findOne(testId);
        expect(result).not.toBeNull();
    });

    it('should fail find template by id (not exist)', async () => {
        await expect(controller.findOne(0)).rejects.toThrow(NotFoundException);
    });

    it('should update template name', async () => {
        const dto = {
            templateName: "updateTemplateName",
        } as UpdateTemplateDto;

        const result = await controller.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull()
        expect(result?.templateName).toEqual("updateTemplateName");
    });

    it('should fail update template name (not exist)', async () => {
        const dto = {
            templateName: "updateTemplateName",
        } as UpdateTemplateDto;

        await expect(controller.update(0, dto)).rejects.toThrow(NotFoundException);
    });

    it('should remove template', async () => {
        const result = await controller.remove(testId);
        expect(result).toBeUndefined();
    });

    it('should fail remove template (not exist)', async () => {
        await expect(controller.remove(testId)).rejects.toThrow(NotFoundException);
    });
});
