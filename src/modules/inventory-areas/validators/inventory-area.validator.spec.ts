import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryArea } from '../entities/inventory-area.entity';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaValidator } from './inventory-area.validator';

describe('inventory area validator', () => {
  let testingUtil: InventoryAreaTestUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: InventoryAreaValidator;
  let areaRepo: Repository<InventoryArea>;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryAreasTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
    await testingUtil.initInventoryAreaTestDatabase(dbTestContext);

    validator = module.get<InventoryAreaValidator>(InventoryAreaValidator);

    areaRepo = module.get(getRepositoryToken(InventoryArea));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  // successfully validate createDto with no validation errors
  it('successfully validate create: no validation errors', async () => {});

  // fail to validate create: name already exists
  it('fail validate create: name already exists', async () => {});

  // successfully validate updateDto with no validation errors
  it('successfully validate update: no validation errors', async () => {});

  // fail to validate update: name already exists
  it('fail validate update: name already exists', async () => {});
});
