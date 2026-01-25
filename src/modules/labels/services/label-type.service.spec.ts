import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateLabelTypeDto } from '../dto/label-type/create-label-type.dto';
import { UpdateLabelTypeDto } from '../dto/label-type/update-label-type.dto';
import { LabelType } from '../entities/label-type.entity';
import { type_a } from '../utils/constants';
import { getLabelsTestingModule } from '../utils/label-testing.module';
import { LabelTestingUtil } from '../utils/label-testing.util';
import { LabelTypeService } from './label-type.service';

class TestableLabelTypeService extends LabelTypeService {
  async createEntityForTest(
    dto: CreateLabelTypeDto,
    manager: EntityManager,
  ): Promise<LabelType> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateLabelTypeDto,
    entity: LabelType,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}
describe('Label type Service', () => {
  let typeService: TestableLabelTypeService;
  let testingUtil: LabelTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;
  let typeRepo: Repository<LabelType>;

  beforeAll(async () => {
    const module: TestingModule = await getLabelsTestingModule({
      labelTypeServiceClass: TestableLabelTypeService,
    });

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<LabelTestingUtil>(LabelTestingUtil);
    await testingUtil.initLabelTypeTestDatabase(dbTestContext);

    typeService = module.get(LabelTypeService) as TestableLabelTypeService;
    dataSource = module.get(DataSource);
    typeRepo = module.get(getRepositoryToken(LabelType));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(typeService).toBeDefined();
  });

  // test createEntity()
  it('should create type', async () => {
    const dto: CreateLabelTypeDto = { name: '5x3', length: 500, width: 300 };

    await dataSource.transaction(async (manager) => {
      const result = await typeService.createEntityForTest(dto, manager);

      expect(result).not.toBeNull();
      expect(result?.id).not.toBeNull();
      expect(result.name).toEqual(dto.name);
      expect(result.length).toEqual(dto.length);
      expect(result.width).toEqual(dto.width);
    });
  });

  // test updateEntity()
  it('should update type', async () => {
    const labelType = await typeRepo.findOne({ where: { name: type_a } });
    if (!labelType) throw new Error('label type not found');

    const dto: UpdateLabelTypeDto = { name: 'Type A Updated', width: 250 };

    await dataSource.transaction(async (manager) => {
      await typeService.updateEntityForTest(dto, labelType, manager);
    });

    const result = await typeRepo.findOne({ where: { id: labelType.id } });
    if (!result) throw new Error('result not found');
    expect(result.name).toEqual(dto.name);
    expect(result.width).toEqual(dto.width);
  });

  // test findAll()
  it('should find all types', async () => {
    const repoResult = await typeRepo.find();
    const serviceResult = await typeService.findAll();
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
  });

  // test findall() with sort by name
  it('should find all types with sort by name', async () => {
    const repoResult = await typeRepo.find({ order: { name: 'DESC' } });
    const serviceResult = await typeService.findAll({
      sortBy: 'name',
      sortOrder: 'DESC',
    });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
    if (repoResult.length > 0) {
      expect(serviceResult?.items[0].name).toEqual(repoResult[0].name);
      const lastIdx = repoResult.length - 1;
      expect(serviceResult?.items[lastIdx].name).toEqual(
        repoResult[lastIdx].name,
      );
    }
  });

  // test findOne()
  it('should find one type', async () => {
    const labelType = await typeRepo.find({ take: 1 });
    if (!labelType.length) throw new Error('label type not found');

    const serviceResult = await typeService.findOne(labelType[0].id);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(labelType[0].id);
  });

  // test remove()
  it('should remove type', async () => {
    const labelType = await typeRepo.find({ take: 1 });
    if (!labelType.length) throw new Error('label type not found');
    const id = labelType[0].id;

    const deleteResult = await typeService.remove(id);
    expect(deleteResult).toBe(true);
    await expect(typeService.findOne(id)).rejects.toThrow(NotFoundException);
  });
});
