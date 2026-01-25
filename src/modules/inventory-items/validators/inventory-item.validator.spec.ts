import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemValidator } from './inventory-item.validator';

describe('inventory item validator', () => {
  let testingUtil: InventoryItemTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: InventoryItemValidator;
  let itemRepo: Repository<InventoryItem>;

  let categoryRepo: Repository<InventoryItemCategory>;
  let vendorRepo: Repository<InventoryItemVendor>;
  let unitRepo: Repository<UnitOfMeasure>;
  let packageRepo: Repository<InventoryItemPackage>;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<InventoryItemTestingUtil>(
      InventoryItemTestingUtil,
    );
    await testingUtil.initInventoryItemSizeTestDatabase(dbTestContext);

    validator = module.get<InventoryItemValidator>(InventoryItemValidator);

    itemRepo = module.get(getRepositoryToken(InventoryItem));
    categoryRepo = module.get(getRepositoryToken(InventoryItemCategory));
    vendorRepo = module.get(getRepositoryToken(InventoryItemVendor));
    unitRepo = module.get(getRepositoryToken(UnitOfMeasure));
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

  it('fail validate create: name already exists', async () => {});

  it('fail validate create: nestedCreateInventoryItemSizeDto errors: measureAmount with value 0', async () => {});

  it('fail validate create: nestedCreateInventoryItemSizeDto errors: cost with value 0', async () => {});

  // Update Validation Tests
  it('successfully validate update with no validation errors', async () => {});

  it('fail validate update: name already exists', async () => {});

  it('fail validate update: nestedUpdateInventoryItemSizeDto errors: measureAmount with value 0', async () => {});

  it('fail validate update: nestedUpdateInventoryItemSizeDto errors: cost with value 0', async () => {});

  it('fail validate update: nestedCreateInventoryItemSizeDto errors: measureAmount with value 0', async () => {});

  it('fail validate update: nestedCreateInventoryItemSizeDto errors: cost with value 0', async () => {});
});
