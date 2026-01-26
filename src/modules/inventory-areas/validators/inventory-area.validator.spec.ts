import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { expectValidationMessage } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryAreaDto } from '../dto/inventory-area/create-inventory-area.dto';
import { UpdateInventoryAreaDto } from '../dto/inventory-area/update-inventory-area.dto';
import { InventoryArea } from '../entities/inventory-area.entity';
import { AREA_A, AREA_B } from '../utils/constants';
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
  it('successfully validate create: no validation errors', async () => {
    const dto: CreateInventoryAreaDto = {
      name: 'New Area Name',
    };

    const errors = await validator.validateCreateNode(dto);
    expect(errors).toBeNull();
  });

  // fail to validate create: name already exists
  it('fail validate create: name already exists', async () => {
    const dto: CreateInventoryAreaDto = {
      name: AREA_A,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'name' }],
      'Inventory area name already exists.',
    );
  });

  // successfully validate updateDto with no validation errors
  it('successfully validate update: no validation errors', async () => {
    const areaToUpdate = await areaRepo.findOne({ where: { name: AREA_A } });
    if (!areaToUpdate) {
      throw new Error('area not found');
    }

    const dto: UpdateInventoryAreaDto = {
      name: 'Updated Area Name',
    };

    const errors = await validator.validateUpdateNode(dto, areaToUpdate.id);
    expect(errors).toBeNull();
  });

  // fail to validate update: name already exists
  it('fail validate update: name already exists', async () => {
    const areaToUpdate = await areaRepo.findOne({ where: { name: AREA_A } });
    if (!areaToUpdate) {
      throw new Error('area not found');
    }

    const dto: UpdateInventoryAreaDto = {
      name: AREA_B,
    };

    const errors = await validator.validateUpdateNode(dto, areaToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'name' }],
      'Inventory area name already exists.',
    );
  });
});
