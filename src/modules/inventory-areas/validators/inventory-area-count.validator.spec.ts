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

  // Create Validation Tests
  it('successfully validate create no validation errors', async () => {});

  it('fail validate create: no counted inventory items', async () => {});

  it('fail validate create: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.amount with value 0', async () => {});

  it('fail validate create: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSizeId with invalid countedInventoryItemId', async () => {});

  it('fail validate create: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSize and inventoryAreaItem.countedItemSizeId both provided', async () => {});

  it('fail validate create: nestedCreateInventoryAreaItemDto errors: neither inventoryAreaItem.countedItemSize and inventoryAreaItem.countedItemSizeId not provided', async () => {});

  it('fail validate create: nestedCreateInventoryAreaItemDto errors: nestedCreateInventoryItemSizeDto errors: measureAmount with value 0', async () => {});

  it('fail validate create: nestedCreateInventoryAreaItemDto errors: nestedCreateInventoryItemSizeDto errors: cost with value 0', async () => {});

  // Update Validation Tests
  it('successfully validate update no validation errors', async () => {});

  it('fail validate update: no counted inventory items', async () => {});

  it('fail validate update: nestedCreateInventoryAreaItemDto and nestedUpdateInventoryAreaItemDto errors', async () => {});

  it('fail validate update: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.amount with value 0', async () => {});

  it('fail validate update: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSizeId with invalid countedInventoryItemId', async () => {});

  it('fail validate update: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSize and inventoryAreaItem.countedItemSizeId both provided', async () => {});

  it('fail validate update: nestedCreateInventoryAreaItemDto errors: nestedCreateInventoryItemSizeDto errors: measureAmount with value 0', async () => {});

  it('fail validate update: nestedCreateInventoryAreaItemDto errors: nestedCreateInventoryItemSizeDto errors: cost with value 0', async () => {});

  it('fail validate update: nestedUpdateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSizeId with invalid countedInventoryItemId', async () => {});

  it('fail validate update: nestedUpdateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSize and inventoryAreaItem.countedItemSizeId both provided', async () => {});
});
