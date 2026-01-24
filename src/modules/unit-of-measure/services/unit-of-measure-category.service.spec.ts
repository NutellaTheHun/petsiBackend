import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/create-unit-of-measure-category.dto';
import { UpdateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/update-unit-of-measure-category.dto';
import { UnitOfMeasureCategory } from '../entities/unit-of-measure-category.entity';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
import { getUnitOfMeasureTestingModule } from '../utils/unit-of-measure-testing-module';
import { UnitOfMeasureTestingUtil } from '../utils/unit-of-measure-testing.util';
import { UnitOfMeasureCategoryService } from './unit-of-measure-category.service';

class TestableUnitOfMeasureCategoryService extends UnitOfMeasureCategoryService {
  async createEntityForTest(
    dto: CreateUnitOfMeasureCategoryDto,
    manager: EntityManager,
  ): Promise<UnitOfMeasureCategory> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateUnitOfMeasureCategoryDto,
    entity: UnitOfMeasureCategory,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('UnitOfMeasureCategoryService', () => {
  let testingUtil: UnitOfMeasureTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;
  let categoryService: UnitOfMeasureCategoryService;

  let unitRepo: Repository<UnitOfMeasure>;

  beforeAll(async () => {
    const module: TestingModule = await getUnitOfMeasureTestingModule({
      unitOfMeasureCategoryServiceClass: TestableUnitOfMeasureCategoryService,
    });
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<UnitOfMeasureTestingUtil>(
      UnitOfMeasureTestingUtil,
    );
    await testingUtil.initUnitOfMeasureTestDatabase(dbTestContext);

    categoryService = module.get(
      UnitOfMeasureCategoryService,
    ) as TestableUnitOfMeasureCategoryService;
    unitRepo = module.get(getRepositoryToken(UnitOfMeasure));

    dataSource = module.get(DataSource);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(categoryService).toBeDefined();
  });

  // test createEntity()
  it('should create unit of measure category', async () => {});

  // test updateEntity()
  it('should update unit of measure category', async () => {});

  // test findAll()
  it('should find all unit of measure categories', async () => {});

  // test findAll() with sortBy name
  it('should find all unit of measure categories with sortBy name', async () => {});

  // test findOne()
  it('should find one unit of measure category', async () => {});

  // test findOne() with relations
  it('should find one unit of measure category with relations', async () => {});

  // test remove()
  it('should remove unit of measure category', async () => {});
});
