import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryArea } from '../entities/inventory-area.entity';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaCountValidator } from './inventory-area-count.validator';

describe('inventory area count validator', () => {
  let testingUtil: InventoryAreaTestUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: InventoryAreaCountValidator;
  let countRepo: Repository<InventoryAreaCount>;
  let areaRepo: Repository<InventoryArea>;
  let itemRepo: Repository<InventoryItem>;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryAreasTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
    await testingUtil.initInventoryAreaItemCountTestDatabase(dbTestContext);

    validator = module.get<InventoryAreaCountValidator>(
      InventoryAreaCountValidator,
    );

    countRepo = module.get(getRepositoryToken(InventoryAreaCount));
    areaRepo = module.get(getRepositoryToken(InventoryArea));
    itemRepo = module.get(getRepositoryToken(InventoryItem));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  // it should successfully validate a create dto with no validation errors
  it('should successfully validate a create dto with no validation errors', async () => {});

  // it should fail to validate a create dto with no counted inventory items
  it('should fail to validate a create dto with no counted inventory items', async () => {});

  // it should fail to validate a create dto with nestedCreateInventoryAreaItemDto errors
  // amount with value 0
  // invalid countedItemSizeId for countedInventoryItemId
  // dto with both countedItemSize and countedItemSizeId
  // error with nested itemSize validator:
  //   measureAmount with value 0
  //   cost with value 0
  it('should fail to validate a create dto with nestedCreateInventoryAreaItemDto errors', async () => {});

  // should successfully validate a update dto with no validation errors
  it('should successfully validate a update dto with no validation errors', async () => {});

  // should fail to validate a update dto with no counted inventory items
  it('should fail to validate a update dto with no counted inventory items', async () => {});

  // should fail to validate a update dto with nestedCreateInventoryAreaItemDto and nestedUpdateInventoryAreaItemDto errors
  // nestedCreateInventoryAreaItemDto errors:
  //   amount with value 0
  //   invalid countedItemSizeId for countedInventoryItemId
  //   dto with both countedItemSize and countedItemSizeId
  // nestedUpdateInventoryAreaItemDto errors:
  //   amount with value 0
  //   invalid countedItemSizeId for countedInventoryItemId
  //   dto with both countedItemSize and countedItemSizeId
  //   countedInventoryItemId with no sizeId or sizeDto
  it('should fail to validate a update dto with nestedCreateInventoryAreaItemDto and nestedUpdateInventoryAreaItemDto errors', async () => {});
});
