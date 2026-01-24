import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItemSize } from '../../inventory-items/entities/inventory-item-size.entity';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { CreateInventoryAreaItemDto } from '../dto/inventory-area-item/create-inventory-area-item.dto';
import { UpdateInventoryAreaItemDto } from '../dto/inventory-area-item/update-inventory-area-item.dto';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryAreaItem } from '../entities/inventory-area-item.entity';
import { InventoryArea } from '../entities/inventory-area.entity';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaItemService } from './inventory-area-item.service';

class TestableInventoryAreaItemService extends InventoryAreaItemService {
  async createEntityForTest(
    dto: CreateInventoryAreaItemDto,
    manager: EntityManager,
  ) {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateInventoryAreaItemDto,
    entity: InventoryAreaItem,
    manager: EntityManager,
  ) {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('Inventory area item service', () => {
  let module: TestingModule;
  let testingUtil: InventoryAreaTestUtil;
  let dbTestContext: DatabaseTestContext;
  let areaItemService: TestableInventoryAreaItemService;
  let dataSource: DataSource;

  let inventoryAreaRepo: Repository<InventoryArea>;
  let inventoryAreaItemRepo: Repository<InventoryAreaItem>;
  let inventoryAreaCountRepo: Repository<InventoryAreaCount>;

  let inventoryItemRepo: Repository<InventoryItem>;
  let inventoryItemSizeRepo: Repository<InventoryItemSize>;

  beforeAll(async () => {
    module = await getInventoryAreasTestingModule({
      areaItemServiceClass: TestableInventoryAreaItemService,
    });

    testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
    dbTestContext = new DatabaseTestContext();
    await testingUtil.initInventoryAreaItemCountTestDatabase(dbTestContext);

    dataSource = module.get(DataSource);

    areaItemService = module.get(
      InventoryAreaItemService,
    ) as TestableInventoryAreaItemService;

    inventoryAreaRepo = module.get(getRepositoryToken(InventoryArea));
    inventoryAreaItemRepo = module.get(getRepositoryToken(InventoryAreaItem));
    inventoryAreaCountRepo = module.get(getRepositoryToken(InventoryAreaCount));
    inventoryItemRepo = module.get(getRepositoryToken(InventoryItem));
    inventoryItemSizeRepo = module.get(getRepositoryToken(InventoryItemSize));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(areaItemService).toBeDefined();
  });

  // test createEntity() with countedItemSizeId
  it('should create area item with countedItemSizeId', async () => {});

  // test createEntity() with countedItemSizeDto
  it('should create area item with countedItemSizeDto', async () => {});

  // test updateEntity() with countedItemSizeId
  it('should update area item with countedItemSizeId', async () => {});

  // test updateEntity() with countedItemSizeDto
  it('should update area item with countedItemSizeDto', async () => {});

  // test findAll()
  it('should find all area items', async () => {});

  // test findall() with search
  it('should find all area items with search', async () => {});

  // test findall() with filter by inventoryAreaCount
  it('should find all area items with filter by inventoryAreaCount', async () => {});

  // test findall() with sort by countedInventoryItem
  it('should find all area items with sort by countedInventoryItem', async () => {});

  // test findall() with sort by amount
  it('should find all area items with sort by amount', async () => {});

  // test findOne()
  it('should find one area item', async () => {});

  // test findOne() with relations
  it('should find one area item with relations', async () => {});

  // test remove()
  it('should remove area item', async () => {});
});
