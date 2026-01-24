import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { CreateInventoryItemDto } from '../dto/inventory-item/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/inventory-item/update-inventory-item.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemService } from './inventory-item.service';

class TestableInventoryItemService extends InventoryItemService {
  async createEntityForTest(
    dto: CreateInventoryItemDto,
    manager: EntityManager,
  ): Promise<InventoryItem> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateInventoryItemDto,
    entity: InventoryItem,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}
describe('Inventory Item Service', () => {
  let module: TestingModule;
  let testingUtil: InventoryItemTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

  let itemService: InventoryItemService;

  let categoryRepo: Repository<InventoryItemCategory>;
  let packageRepo: Repository<InventoryItemPackage>;
  let sizeRepo: Repository<InventoryItemSize>;
  let vendorRepo: Repository<InventoryItemVendor>;
  let measureRepo: Repository<UnitOfMeasure>;

  beforeAll(async () => {
    module = await getInventoryItemTestingModule({
      inventoryItemServiceClass: TestableInventoryItemService,
    });
    testingUtil = module.get<InventoryItemTestingUtil>(
      InventoryItemTestingUtil,
    );
    dbTestContext = new DatabaseTestContext();
    await testingUtil.initInventoryItemSizeTestDatabase(dbTestContext);
    itemService = module.get(
      InventoryItemService,
    ) as TestableInventoryItemService;
    dataSource = module.get(DataSource);

    categoryRepo = module.get(getRepositoryToken(InventoryItemCategory));
    packageRepo = module.get(getRepositoryToken(InventoryItemPackage));
    sizeRepo = module.get(getRepositoryToken(InventoryItemSize));
    vendorRepo = module.get(getRepositoryToken(InventoryItemVendor));
    measureRepo = module.get(getRepositoryToken(UnitOfMeasure));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(itemService).toBeDefined();
  });

  // test createEntity() with nestedCreateInventoryItemSizeDto
  it('should create item with nestedCreateInventoryItemSizeDto', async () => {});

  // test updateEntity() with nestedUpdateInventoryItemSizeDto and nestedCreateInventoryItemSizeDto
  it('should update item with nestedUpdateInventoryItemSizeDto and nestedCreateInventoryItemSizeDto', async () => {});

  // test findAll()
  it('should find all items', async () => {});

  // test findAll() with search by name
  it('should find all items with search by name', async () => {});

  // test findAll() with filter by category
  it('should find all items with filter by category', async () => {});

  // test findAll() with filter by vendor
  it('should find all items with filter by vendor', async () => {});

  // test findAll() with filter by category and vendor
  it('should find all items with filter by category and vendor', async () => {});

  // test findOne()
  it('should find one item', async () => {});

  // test findOne() with relations
  it('should find one item with relations', async () => {});

  // test remove()
  it('should remove item', async () => {});
});
