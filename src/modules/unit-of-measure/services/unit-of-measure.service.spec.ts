import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateUnitOfMeasureDto } from '../dto/unit-of-measure/create-unit-of-measure.dto';
import { UpdateUnitOfMeasureDto } from '../dto/unit-of-measure/update-unit-of-measure.dto';
import { UnitOfMeasureCategory } from '../entities/unit-of-measure-category.entity';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
import { getUnitOfMeasureTestingModule } from '../utils/unit-of-measure-testing-module';
import { UnitOfMeasureTestingUtil } from '../utils/unit-of-measure-testing.util';
import { UnitOfMeasureService } from './unit-of-measure.service';

class TestableUnitOfMeasureService extends UnitOfMeasureService {
  async createEntityForTest(
    dto: CreateUnitOfMeasureDto,
    manager: EntityManager,
  ): Promise<UnitOfMeasure> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateUnitOfMeasureDto,
    entity: UnitOfMeasure,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('UnitOfMeasureService', () => {
  let testingUtil: UnitOfMeasureTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let unitService: UnitOfMeasureService;
  let dataSource: DataSource;

  let categoryRepo: Repository<UnitOfMeasureCategory>;

  beforeAll(async () => {
    const module: TestingModule = await getUnitOfMeasureTestingModule({
      unitOfMeasureServiceClass: TestableUnitOfMeasureService,
    });

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<UnitOfMeasureTestingUtil>(
      UnitOfMeasureTestingUtil,
    );
    await testingUtil.initUnitOfMeasureTestDatabase(dbTestContext);

    unitService = module.get<UnitOfMeasureService>(
      UnitOfMeasureService,
    ) as TestableUnitOfMeasureService;
    categoryRepo = module.get(getRepositoryToken(UnitOfMeasureCategory));

    dataSource = module.get(DataSource);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('unitService should be defined', () => {
    expect(unitService).toBeDefined();
  });

  // test createEntity()
  it('should create unit of measure', async () => {});

  // test updateEntity()
  it('should update unit of measure', async () => {});

  // test findAll()
  it('should find all unit of measures', async () => {});

  // test findAll() with search by name
  it('should find all unit of measures with search by name', async () => {});

  // test findAll() with filter by category
  it('should find all unit of measures with filter by category', async () => {});

  // test findAll() with sortBy category
  it('should find all unit of measures with sortBy category', async () => {});

  // test findAll() with sortBy name
  it('should find all unit of measures with sortBy name', async () => {});

  // test findOne()
  it('should find one unit of measure', async () => {});

  // test findOne() with relations
  it('should find one unit of measure with relations', async () => {});

  // test remove()
  it('should remove unit of measure', async () => {});
});
