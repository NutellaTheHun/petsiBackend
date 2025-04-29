import { TestingModule } from '@nestjs/testing';
import { Label } from '../entities/label.entity';
import { LabelService } from '../services/label.service';
import { getLabelsTestingModule } from '../utils/label-testing.module';
import { LabelController } from './label.controller';
import { getTestImageUrls } from '../utils/constants';
import { CreateLabelDto } from '../dto/create-label.dto';
import { UpdateLabelDto } from '../dto/update-label.dto';

describe('Label  Controller', () => {
  let controller: LabelController;
  let service: LabelService;

  let labels: Label[];
  let labelId: number = 1;

  let testId: number;

  beforeAll(async () => {
    const module: TestingModule = await getLabelsTestingModule();

    controller = module.get<LabelController>(LabelController);
    service = module.get<LabelService>(LabelService);

    const urls = getTestImageUrls();
    labels = urls.map(url => ({
      id: labelId++,
      imageUrl: url,
    }) as Label);

    jest.spyOn(service, 'create').mockImplementation(async (dto: CreateLabelDto) => {
        const label = {
          id: labelId++,
          imageUrl: dto.imageUrl,
        } as Label;
  
        labels.push(label);
        return label;
    });

    jest.spyOn(service, 'findAll').mockResolvedValue({ items: labels });

    jest.spyOn(service, 'findEntitiesById').mockImplementation(async (ids: number[]) => {
      return labels.filter(label => ids.findIndex(id => id === label.id) !== -1);
    });

    jest.spyOn(service, 'findOne').mockImplementation(async (id: number) => {
      return labels.find(label => label.id === id) || null;
    });

    jest.spyOn(service, 'remove').mockImplementation(async (id: number) => {
      const index = labels.findIndex(label => label.id === id);
      if(index === -1){ return false; }

      labels.splice(index, 1);
      return true;
    });

    jest.spyOn(service, 'update').mockImplementation(async (id: number, dto: UpdateLabelDto) => {
      const existIdx = labels.findIndex(label => label.id === id);
      if(existIdx === -1){ return null; }

      if(dto.imageUrl){
        labels[existIdx].imageUrl = dto.imageUrl;
      }

      return labels[existIdx];
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a label', async () => {
    const dto = {
      imageUrl: "testUrl",
    } as CreateLabelDto;

    const result = await controller.create(dto);

    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull()
    expect(result?.imageUrl).toEqual("testUrl");

    testId = result?.id as number;
  });
  /*
  it('should fail to create a label (already exists)', async () => {
      const dto = {
        menuItemId: ,
        imageUrl: "testUrl",
        typeId: ,
      } as CreateLabelDto;
      
      const result = await controller.create(dto);
  
      expect(result).toBeNull();
  });*/

  it('should find label by id', async () => {
    const result = await controller.findOne(testId);
    expect(result).not.toBeNull();
  });

  it('should fail find label by id (not exist)', async () => {
    const result = await controller.findOne(0);
    expect(result).toBeNull();
  });

  it('should update label url', async () => {
    const dto = {
      imageUrl: "updateTestUrl",
    } as UpdateLabelDto;

    const result = await controller.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull()
    expect(result?.imageUrl).toEqual("updateTestUrl");
  });

  it('should fail update label url (not exist)', async () => {
    const dto = {
      imageUrl: "updateTestUrl",
    } as UpdateLabelDto;

    const result = await controller.update(0, dto);

    expect(result).toBeNull();
  });

  it('should remove label', async () => {
    const result = await controller.remove(testId);
    expect(result).toBeTruthy();
  });

  it('should fail remove label (not exist)', async () => {
    const result = await controller.remove(testId);
    expect(result).toBeFalsy();
  });
});
