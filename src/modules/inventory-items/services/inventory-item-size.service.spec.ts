import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { UnitOfMeasureCategory } from '../../unit-of-measure/entities/unit-of-measure-category.entity';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { CreateInventoryItemSizeDto } from '../dto/inventory-item-size/create-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../dto/inventory-item-size/update-inventory-item-size.dto';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemSizeService } from './inventory-item-size.service';

class TestableInventoryItemSizeService extends InventoryItemSizeService {
  async createEntityForTest(
    dto: CreateInventoryItemSizeDto,
    manager: EntityManager,
  ): Promise<InventoryItemSize> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateInventoryItemSizeDto,
    entity: InventoryItemSize,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('Inventory Item Size Service', () => {
  let module: TestingModule;
  let testingUtil: InventoryItemTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let sizeService: InventoryItemSizeService;
  let dataSource: DataSource;

  let unitRepo: Repository<UnitOfMeasure>;
  let unitCategoryRepo: Repository<UnitOfMeasureCategory>;
  let packageRepo: Repository<InventoryItemPackage>;
  let itemRepo: Repository<InventoryItem>;

  beforeAll(async () => {
    module = await getInventoryItemTestingModule({
      inventoryItemSizeServiceClass: TestableInventoryItemSizeService,
    });
    dbTestContext = new DatabaseTestContext();

    testingUtil = module.get<InventoryItemTestingUtil>(
      InventoryItemTestingUtil,
    );
    await testingUtil.initInventoryItemSizeTestDatabase(dbTestContext);

    sizeService = module.get(
      InventoryItemSizeService,
    ) as TestableInventoryItemSizeService;

    dataSource = module.get(DataSource);

    packageRepo = module.get(getRepositoryToken(InventoryItemPackage));
    unitCategoryRepo = module.get(getRepositoryToken(UnitOfMeasureCategory));
    itemRepo = module.get(getRepositoryToken(InventoryItem));
    unitRepo = module.get(getRepositoryToken(UnitOfMeasure));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(sizeService).toBeDefined();
  });

  // test createEntity()
  it('should create size', async () => {});

  // test updateEntity()
  it('should update size', async () => {});

  // test findAll()
  it('should find all sizes', async () => {});

  // test findall() with sort by cost
  it('should find all sizes with sort by cost', async () => {});

  // test findOne()
  it('should find one size', async () => {});

  // test findOne() with relations
  it('should find one size with relations', async () => {});

  // test remove()
  it('should remove size', async () => {});
});
