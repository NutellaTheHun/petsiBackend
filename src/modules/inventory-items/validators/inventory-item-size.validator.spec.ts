import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemSizeValidator } from './inventory-item-size.validator';

describe('inventory item package validator', () => {
  let testingUtil: InventoryItemTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: InventoryItemSizeValidator;
  let sizeRepo: Repository<InventoryItemSize>;

  let unitRepo: Repository<UnitOfMeasure>;
  let packageRepo: Repository<InventoryItemPackage>;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<InventoryItemTestingUtil>(
      InventoryItemTestingUtil,
    );
    await testingUtil.initInventoryItemSizeTestDatabase(dbTestContext);

    validator = module.get<InventoryItemSizeValidator>(
      InventoryItemSizeValidator,
    );

    sizeRepo = module.get(getRepositoryToken(InventoryItemSize));
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
  it('successfully validate create: no validation errors', async () => {});

  it('fail validate create: measureAmount with value 0', async () => {});

  it('fail validate create: cost with value 0', async () => {});

  it('fail validate create: itemSize already exists for inventory item.', async () => {});

  // Nested Create Validation Tests
  it('successfully validate nestedCreate: no validation errors', async () => {});

  it('fail validate nestedCreate: measureAmount with value 0', async () => {});

  it('fail validate nestedCreate: cost with value 0', async () => {});

  // Update Validation Tests
  it('successfully validate update: no validation errors', async () => {});

  it('fail validate update: measureAmount with value 0', async () => {});

  it('fail validate update: cost with value 0', async () => {});

  it('fail validate update: itemSize already exists for inventory item.', async () => {});
});
