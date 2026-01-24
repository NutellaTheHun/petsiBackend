import { TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateLabelTypeDto } from '../dto/label-type/create-label-type.dto';
import { UpdateLabelTypeDto } from '../dto/label-type/update-label-type.dto';
import { LabelType } from '../entities/label-type.entity';
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
  let typeService: LabelTypeService;
  let testingUtil: LabelTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module: TestingModule = await getLabelsTestingModule({
      labelTypeServiceClass: TestableLabelTypeService,
    });

    typeService = module.get(LabelTypeService) as TestableLabelTypeService;
    testingUtil = module.get<LabelTestingUtil>(LabelTestingUtil);
    dbTestContext = new DatabaseTestContext();
    dataSource = module.get(DataSource);
    await testingUtil.initLabelTypeTestDatabase(dbTestContext);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(typeService).toBeDefined();
  });

  // test createEntity()
  it('should create type', async () => {});

  // test updateEntity()
  it('should update type', async () => {});

  // test findAll()
  it('should find all types', async () => {});

  // test findall() with sort by name
  it('should find all types with sort by name', async () => {});

  // test findOne()
  it('should find one type', async () => {});

  // test remove()
  it('should remove type', async () => {});
});
