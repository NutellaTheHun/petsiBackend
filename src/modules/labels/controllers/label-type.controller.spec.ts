import { TestingModule } from '@nestjs/testing';
import { CreateLabelTypeDto } from '../dto/label-type/create-label-type.dto';
import { UpdateLabelTypeDto } from '../dto/label-type/update-label-type.dto';
import { LabelType } from '../entities/label-type.entity';
import { LabelTypeService } from '../services/label-type.service';
import { getTestLabelTypeNames } from '../utils/constants';
import { getLabelsTestingModule } from '../utils/label-testing.module';
import { LabelTypeController } from './label-type.controller';
import { AppHttpException } from '../../../util/exceptions/AppHttpException';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('Label type Controller', () => {
  let controller: LabelTypeController;
  let service: LabelTypeService;

  let types: LabelType[];
  let typeId: number = 1;

  let testId: number;

  beforeAll(async () => {
    const module: TestingModule = await getLabelsTestingModule();

    controller = module.get<LabelTypeController>(LabelTypeController);
    service = module.get<LabelTypeService>(LabelTypeService);

    const typeNames = getTestLabelTypeNames();
    types = typeNames.map(name => ({
      id: typeId++,
      name: name,
    }) as LabelType);

    jest.spyOn(service, 'create').mockImplementation(async (dto: CreateLabelTypeDto) => {
        const exists = types.find(type => type.name === dto.name);
        if(exists){ throw new BadRequestException(); }

        const labelType = {
          id: typeId++,
          name: dto.name,
        } as LabelType;

        types.push(labelType);
        return labelType;
      }
    );

    jest.spyOn(service, 'findAll').mockResolvedValue({ items: types });

    jest.spyOn(service, 'findEntitiesById').mockImplementation(async (ids: number[]) => {
        return types.filter(type => ids.findIndex(id => id === type.id) !== -1);
      }
    );

    jest.spyOn(service, 'findOne').mockImplementation(async (id?: number) => {
      if(!id){ throw new Error(); }
      const result = types.find(type => type.id === id);
      if(!result){
        throw new NotFoundException();
      }
      return result;

    });

    jest.spyOn(service, 'findOneByName').mockImplementation(async (name: string) => {
        return types.find(type => type.name === name) || null;
      }
    );

    jest.spyOn(service, 'remove').mockImplementation(async (id: number) => {
        const index = types.findIndex(type => type.id === id);
        if(index === -1){ return false; }

        types.splice(index, 1);
        return true;
      }
    );

    jest.spyOn(service, 'update').mockImplementation(async (id: number, dto: UpdateLabelTypeDto) => {
        const existIdx = types.findIndex(type => type.id === id);
        if(existIdx === -1){ throw new NotFoundException(); }

        if(dto.name){
          types[existIdx].name = dto.name;
        }
        
        return types[existIdx];
      }
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a label type', async () => {
    const dto = {
      name: "testLabel",
    } as CreateLabelTypeDto;

    const result = await controller.create(dto);

    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull()
    expect(result?.name).toEqual("testLabel");

    testId = result?.id as number;
  });

  it('should fail to create a label type (already exists)', async () => {
    const dto = {
      name: "testLabel",
    } as CreateLabelTypeDto;
    
    await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
  });

  it('should find label type by id', async () => {
    const result = await controller.findOne(testId);
    expect(result).not.toBeNull();
  });

  it('should fail find label type by id (not exist)', async () => {
    await expect(controller.findOne(0)).rejects.toThrow(Error);
  });

  it('should update label type name', async () => {
    const dto = {
      name: "updateTestLabel",
    } as UpdateLabelTypeDto;

    const result = await controller.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull()
    expect(result?.name).toEqual("updateTestLabel");
  });

  it('should fail update label type name (not exist)', async () => {
    const dto = {
      name: "updateTestLabel",
    } as UpdateLabelTypeDto;

    await expect(controller.update(0, dto)).rejects.toThrow(NotFoundException);
  });

  it('should remove label type', async () => {
    const result = await controller.remove(testId);
    expect(result).toBeUndefined();
  });

  it('should fail remove label type (not exist)', async () => {
    await expect(controller.remove(testId)).rejects.toThrow(NotFoundException);
  });
});