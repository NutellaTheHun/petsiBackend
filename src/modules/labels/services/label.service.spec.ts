import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { CreateLabelDto } from '../dto/label/create-label.dto';
import { UpdateLabelDto } from '../dto/label/update-label.dto';
import { LabelType } from '../entities/label-type.entity';
import { Label } from '../entities/label.entity';
import { getLabelsTestingModule } from '../utils/label-testing.module';
import { LabelTestingUtil } from '../utils/label-testing.util';
import { LabelService } from './label.service';

class TestableLabelService extends LabelService {
  async createEntityForTest(
    dto: CreateLabelDto,
    manager: EntityManager,
  ): Promise<Label> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateLabelDto,
    entity: Label,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('Label Service', () => {
  let labelService: LabelService;
  let testingUtil: LabelTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

  let labelTypeRepo: Repository<LabelType>;
  let itemRepo: Repository<MenuItem>;

  beforeAll(async () => {
    const module: TestingModule = await getLabelsTestingModule({
      labelServiceClass: TestableLabelService,
    });

    labelService = module.get(LabelService) as TestableLabelService;
    testingUtil = module.get<LabelTestingUtil>(LabelTestingUtil);
    dbTestContext = new DatabaseTestContext();
    await testingUtil.initLabelTestDatabase(dbTestContext);
    dataSource = module.get(DataSource);

    labelTypeRepo = module.get(getRepositoryToken(LabelType));
    itemRepo = module.get(getRepositoryToken(MenuItem));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(labelService).toBeDefined();
  });

  // test createEntity()
  it('should create label', async () => {});

  // test updateEntity()
  it('should update label', async () => {});

  // test findAll()
  it('should find all labels', async () => {});

  // test findAll() with search by menuItem name
  it('should find all labels with search by menuItem name', async () => {});

  // test findAll() with filter by labelType
  it('should find all labels with filter by labelType', async () => {});

  // test findAll() with sortBy labelType
  it('should find all labels with sortBy labelType', async () => {});

  // test findOne()
  it('should find one label', async () => {});

  // test findOne() with relations
  it('should find one label with relations', async () => {});

  // test remove()
  it('should remove label', async () => {});
});
