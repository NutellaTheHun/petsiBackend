import { TestingModule } from '@nestjs/testing';
import { TemplateMenuItemController } from './template-menu-item.controller';
import { TemplateMenuItemService } from '../services/template-menu-item.service';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { getTemplateTestingModule } from '../utils/template-testing.module';
import { CreateTemplateMenuItemDto } from '../dto/template-menu-item/create-template-menu-item.dto';
import { UpdateTemplateMenuItemDto } from '../dto/template-menu-item/update-template-menu-item.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AppHttpException } from '../../../util/exceptions/AppHttpException';

describe('template menu item controller', () => {
  let controller: TemplateMenuItemController;
  let service: TemplateMenuItemService;

  let items: TemplateMenuItem[];
  let itemId = 1;
  let testId: number;

  beforeAll(async () => {
    const module: TestingModule = await getTemplateTestingModule();

    controller = module.get<TemplateMenuItemController>(TemplateMenuItemController);
    service = module.get<TemplateMenuItemService>(TemplateMenuItemService);

    items = [];

    jest.spyOn(service, 'create').mockImplementation(async (dto: CreateTemplateMenuItemDto) => {
      const item = {
        id: itemId++,
        displayName: dto.displayName,
        tablePosIndex: dto.tablePosIndex
      } as TemplateMenuItem;

      items.push(item);
      return item;
    });

    jest.spyOn(service, 'findAll').mockResolvedValue({items: items });

    jest.spyOn(service, 'findEntitiesById').mockImplementation(async (ids: number[]) => {
      return items.filter(item => ids.findIndex(id => id === item.id) !== -1);
    });

    jest.spyOn(service, 'findOne').mockImplementation(async (id?: number) => {
      if(!id){ throw new BadRequestException(); }
      const result = items.find(item => item.id === id);
      if(!result){
        throw new NotFoundException();
      }
      return result;
    });

    jest.spyOn(service, 'remove').mockImplementation(async (id: number) => {
      const index = items.findIndex(item => item.id === id);
      if(index === -1){ return false; }

      items.splice(index, 1);
      return true;
    });

    jest.spyOn(service, 'update').mockImplementation(async (id: number, dto: UpdateTemplateMenuItemDto) => {
      const existIdx = items.findIndex(item => item.id === id);
      if(existIdx === -1){ throw new NotFoundException(); }

      if(dto.displayName){
        items[existIdx].displayName = dto.displayName;
      }

      return items[existIdx];
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a template item', async () => {
        const dto = {
          displayName: "testDisplayName",
          tablePosIndex: 1,
        } as CreateTemplateMenuItemDto;
    
        const result = await controller.create(dto);
    
        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull()
        expect(result?.displayName).toEqual("testDisplayName");
        expect(result?.tablePosIndex).toEqual(1);
    
        testId = result?.id as number;
      });
    
      it('should find template item by id', async () => {
        const result = await controller.findOne(testId);
        expect(result).not.toBeNull();
      });
    
      it('should fail find template item by id (not exist)', async () => {
        await expect(controller.findOne(0)).rejects.toThrow(BadRequestException);
      });
    
      it('should update template item display name', async () => {
        const dto = {
          displayName: "update displayName",
        } as UpdateTemplateMenuItemDto;
    
        const result = await controller.update(testId, dto);
    
        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull()
        expect(result?.displayName).toEqual("update displayName");
      });
    
      it('should fail update template item display name (not exist)', async () => {
        const dto = {
          displayName: "update displayName",
        } as UpdateTemplateMenuItemDto;
    
        await expect(controller.update(0, dto)).rejects.toThrow(NotFoundException);
      });
    
      it('should remove template item', async () => {
        const result = await controller.remove(testId);
        expect(result).toBeUndefined();
      });
    
      it('should fail remove template item (not exist)', async () => {
        await expect(controller.remove(testId)).rejects.toThrow(NotFoundException);
      });
});
