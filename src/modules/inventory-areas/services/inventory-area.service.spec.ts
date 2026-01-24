import { TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryAreaDto } from '../dto/inventory-area/create-inventory-area.dto';
import { UpdateInventoryAreaDto } from '../dto/inventory-area/update-inventory-area.dto';
import { InventoryArea } from '../entities/inventory-area.entity';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaService } from './inventory-area.service';

class TestableInventoryAreaService extends InventoryAreaService {
  async createEntityForTest(
    dto: CreateInventoryAreaDto,
    manager: EntityManager,
  ) {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateInventoryAreaDto,
    entity: InventoryArea,
    manager: EntityManager,
  ) {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('Inventory area service', () => {
  let testingUtil: InventoryAreaTestUtil;
  let dbTestContext: DatabaseTestContext;
  let service: InventoryAreaService;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryAreasTestingModule({
      areaServiceClass: TestableInventoryAreaService,
    });

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
    await testingUtil.initInventoryAreaTestDatabase(dbTestContext);

    service = module.get(InventoryAreaService) as TestableInventoryAreaService;

    dataSource = module.get(DataSource);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // test createEntity()
  it('should create area', async () => {});

  // test updateEntity()
  it('should update area', async () => {});

  // test findAll()
  it('should find all areas', async () => {});

  // test findall() with sort by name
  it('should find all areas with sort by name', async () => {});

  // test findOne()
  it('should find one area', async () => {});

  // test findOne() with relations
  it('should find one area with relations', async () => {});

  // test remove()
  it('should remove area', async () => {});
});
