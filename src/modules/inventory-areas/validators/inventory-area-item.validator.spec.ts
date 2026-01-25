import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItemPackage } from '../../inventory-items/entities/inventory-item-package.entity';
import { InventoryItemSize } from '../../inventory-items/entities/inventory-item-size.entity';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryAreaItem } from '../entities/inventory-area-item.entity';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaItemValidator } from './inventory-area-item.validator';

describe('inventory area item validator', () => {
  let testingUtil: InventoryAreaTestUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: InventoryAreaItemValidator;

  let areaItemRepo: Repository<InventoryAreaItem>;
  let areaCountRepo: Repository<InventoryAreaCount>;
  let itemRepo: Repository<InventoryItem>;
  let itemSizeRepo: Repository<InventoryItemSize>;

  let measureRepo: Repository<UnitOfMeasure>;
  let packageRepo: Repository<InventoryItemPackage>;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryAreasTestingModule();
    testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
    await testingUtil.initInventoryAreaItemCountTestDatabase(dbTestContext);
    dbTestContext = new DatabaseTestContext();

    validator = module.get<InventoryAreaItemValidator>(
      InventoryAreaItemValidator,
    );

    areaItemRepo = module.get(getRepositoryToken(InventoryAreaItem));
    areaCountRepo = module.get(getRepositoryToken(InventoryAreaCount));
    itemRepo = module.get(getRepositoryToken(InventoryItem));
    itemSizeRepo = module.get(getRepositoryToken(InventoryItemSize));
    measureRepo = module.get(getRepositoryToken(UnitOfMeasure));
    packageRepo = module.get(getRepositoryToken(InventoryItemPackage));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  // Create Validation Tests
  it('successfully validate create with no validation errors', async () => {});

  it('fail validate create: amount with value 0', async () => {});

  it('fail validate create: inventoryItemSizeId and countedItemSize both provided', async () => {});

  it('fail validate create: neither inventoryItemSizeId nor countedItemSize provided', async () => {});

  it('fail validate create: countedInventoryItemId with invalid countedItemSizeId', async () => {});

  it('fail validate create: nestedCreateInventoryItemSizeDto errors: measureAmount with value 0', async () => {});

  it('fail validate create: nestedCreateInventoryItemSizeDto errors: cost with value 0', async () => {});

  // Update Validation Tests
  it('successfully validate update with no validation errors', async () => {});

  it('fail validate update: amount with value 0', async () => {});

  it('fail validate update: countedItemSizeId with invalid for existing countedInventoryItem', async () => {});

  it('fail validate update: countedInventoryItemId with invalid countedItemSizeId', async () => {});

  it('fail validate update: countedItemSizeId and countedItemSize both provided', async () => {});

  it('fail validate update: countedInventoryItemId with no sizeId or sizeDto', async () => {});

  it('fail validate update: nestedUpdateInventoryItemSizeDto errors: measureAmount with value 0', async () => {});

  it('fail validate update: nestedUpdateInventoryItemSizeDto errors: cost with value 0', async () => {});

  it('fail validate update: nestedUpdateInventoryItemSizeDto errors: already exists', async () => {});
});
