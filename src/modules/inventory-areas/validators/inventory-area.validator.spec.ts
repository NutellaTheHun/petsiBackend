import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { EXIST } from '../../../util/exceptions/error_constants';
import { ValidationException } from '../../../util/exceptions/validation-exception';
import { CreateInventoryAreaDto } from '../dto/inventory-area/create-inventory-area.dto';
import { UpdateInventoryAreaDto } from '../dto/inventory-area/update-inventory-area.dto';
import { InventoryAreaService } from '../services/inventory-area.service';
import { AREA_A } from '../utils/constants';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaValidator } from './inventory-area.validator';

describe('inventory area validator', () => {
  let testingUtil: InventoryAreaTestUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: InventoryAreaValidator;
  let service: InventoryAreaService;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryAreasTestingModule();
    validator = module.get<InventoryAreaValidator>(InventoryAreaValidator);
    service = module.get<InventoryAreaService>(InventoryAreaService);

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
    await testingUtil.initInventoryAreaTestDatabase(dbTestContext);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  it('should validate create', async () => {
    const dto = {
      areaName: 'testValidateArea',
    } as CreateInventoryAreaDto;

    await validator.validateCreate(dto);
  });

  it('should fail create (name already exists)', async () => {
    const dto = {
      areaName: AREA_A,
    } as CreateInventoryAreaDto;

    try {
      await validator.validateCreate(dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(EXIST);
    }
  });

  it('should pass update', async () => {
    const area = await service.findOneByName(AREA_A);
    if (!area) {
      throw new Error();
    }

    const dto = {
      areaName: 'testValidateArea',
    } as UpdateInventoryAreaDto;

    await validator.validateUpdate(area.id, dto);
  });

  it('should fail update (name already exists)', async () => {
    const area = await service.findOneByName(AREA_A);
    if (!area) {
      throw new Error();
    }

    const dto = {
      areaName: AREA_A,
    } as UpdateInventoryAreaDto;

    try {
      await validator.validateUpdate(area.id, dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(EXIST);
    }
  });
});
