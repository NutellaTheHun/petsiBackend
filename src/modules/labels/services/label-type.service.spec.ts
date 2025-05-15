import { TestingModule } from '@nestjs/testing';
import { getLabelsTestingModule } from '../utils/label-testing.module';
import { LabelTestingUtil } from '../utils/label-testing.util';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { LabelTypeService } from './label-type.service';
import { CreateLabelTypeDto } from '../dto/create-label-type.dto';
import { UpdateLabelTypeDto } from '../dto/update-label-type.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('Label type Service', () => {
  let typeService: LabelTypeService;
  let testingUtil: LabelTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let testId: number;
  let testIds: number[];

  beforeAll(async () => {
    const module: TestingModule = await getLabelsTestingModule();

    typeService = module.get<LabelTypeService>(LabelTypeService);
    testingUtil = module.get<LabelTestingUtil>(LabelTestingUtil);
    dbTestContext = new DatabaseTestContext();
    await testingUtil.initLabelTypeTestDatabase(dbTestContext);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(typeService).toBeDefined();
  });

  it('should create a type', async () => {
    const dto = {
      name: "testType",
    } as CreateLabelTypeDto;

    const result = await typeService.create(dto);

    expect(result).not.toBeNull();
    expect(result?.name).toEqual("testType");

    testId = result?.id as number;
  });

  it('should find a type by id', async () => {
    const result = await typeService.findOne(testId);
    
    expect(result).not.toBeNull();
    expect(result?.id).toEqual(testId);
    expect(result?.name).toEqual("testType");
  });

  it('should find a type by name', async () => {
    const result = await typeService.findOneByName("testType");
    
    expect(result).not.toBeNull();
    expect(result?.id).toEqual(testId);
    expect(result?.name).toEqual("testType");
  });

  it('should update a type name', async () => {
    const dto = {
      name: "updateLabelType"
    } as UpdateLabelTypeDto;

    const result = await typeService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.name).toEqual("updateLabelType");
  });

  it('should find all types', async () => {
    const results = await typeService.findAll();

    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(5);

    testIds = results.items.slice(0,3).map(type => type.id);
  });

  it('should find types by list of ids', async () => {
    const results = await typeService.findEntitiesById(testIds);

    expect(results).not.toBeNull();
    expect(results.length).toEqual(3);
  });

  it('should remove a type', async () => {
    const removal = await typeService.remove(testId);
    expect(removal).toBeTruthy();

    await expect(typeService.findOne(testId)).rejects.toThrow(NotFoundException);
  });
});
