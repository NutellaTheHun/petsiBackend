import { TestingModule } from '@nestjs/testing';
import { TemplateService } from '../services/template.service';
import { TemplateController } from './template.controller';
import { Template } from '../entities/template.entity';
import { getTemplateTestingModule } from '../utils/template-testing.module';
import { getTestTemplateNames } from '../utils/constants';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';
import { BadRequestException } from '@nestjs/common';

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
      name: name,
    }) as Template);

    jest.spyOn(service, 'create').mockImplementation(async (dto: CreateTemplateDto) => {
      const exists = templates.find(temp => temp.name === dto.name);
      if(exists){ return null; }

      const template = {
        id: templateId++,
        name: dto.name,
      } as Template;

      templates.push(template);
      return template;
    });

    jest.spyOn(service, 'findAll').mockResolvedValue({items: templates });

    jest.spyOn(service, 'findEntitiesById').mockImplementation(async (ids: number[]) => {
      return templates.filter(temp => ids.findIndex(id => id === temp.id) !== -1);
    });

    jest.spyOn(service, 'findOne').mockImplementation(async (id?: number) => {
      if(!id){ throw new BadRequestException(); }
      return templates.find(temp => temp.id === id) || null;
    });

    jest.spyOn(service, 'findOneByName').mockImplementation(async (name: string) => {
      return templates.find(temp => temp.name === name) || null;
    });

    jest.spyOn(service, 'remove').mockImplementation(async (id: number) => {
      const index = templates.findIndex(temp => temp.id === id);
      if(index === -1){ return false; }

      templates.splice(index, 1);
      return true;
    });

    jest.spyOn(service, 'update').mockImplementation(async (id: number, dto: UpdateTemplateDto) => {
      const existIdx = templates.findIndex(temp => temp.id === id);
      if(existIdx === -1){ return null; }

      if(dto.name){
        templates[existIdx].name = dto.name;
      }

      return templates[existIdx];
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a template', async () => {
      const dto = {
        name: "testTemplate",
      } as CreateTemplateDto;
  
      const result = await controller.create(dto);
  
      expect(result).not.toBeNull();
      expect(result?.id).not.toBeNull()
      expect(result?.name).toEqual("testTemplate");
  
      testId = result?.id as number;
    });
  
    it('should fail to create a template (already exists)', async () => {
      const dto = {
        name: "testTemplate",
      } as CreateTemplateDto;
      
      const result = await controller.create(dto);
  
      expect(result).toBeNull();
    });
  
    it('should find template by id', async () => {
      const result = await controller.findOne(testId);
      expect(result).not.toBeNull();
    });
  
    it('should fail find template by id (not exist)', async () => {
      //const result = await controller.findOne(0);
      //expect(result).toBeNull();
      await expect(controller.findOne(0)).rejects.toThrow(BadRequestException);
    });
  
    it('should update template name', async () => {
      const dto = {
        name: "updateTemplateName",
      } as UpdateTemplateDto;
  
      const result = await controller.update(testId, dto);
  
      expect(result).not.toBeNull();
      expect(result?.id).not.toBeNull()
      expect(result?.name).toEqual("updateTemplateName");
    });
  
    it('should fail update template name (not exist)', async () => {
      const dto = {
        name: "updateTemplateName",
      } as UpdateTemplateDto;
  
      const result = await controller.update(0, dto);
  
      expect(result).toBeNull();
    });
  
    it('should remove template', async () => {
      const result = await controller.remove(testId);
      expect(result).toBeTruthy();
    });
  
    it('should fail remove template (not exist)', async () => {
      const result = await controller.remove(testId);
      expect(result).toBeFalsy();
    });
});
