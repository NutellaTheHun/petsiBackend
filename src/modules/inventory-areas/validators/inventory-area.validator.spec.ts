import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
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

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should fail create (name already exists)', async () => {
    const dto = {
      areaName: AREA_A,
    } as CreateInventoryAreaDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
  });

  it('should pass update', async () => {
    const area = await service.findOneByName(AREA_A);
    if (!area) {
      throw new Error();
    }

    const dto = {
      areaName: 'testValidateArea',
    } as UpdateInventoryAreaDto;

    await validator.validateUpdateNode('root', dto, area.id);
  });

  it('should fail update (name already exists)', async () => {
    const area = await service.findOneByName(AREA_A);
    if (!area) {
      throw new Error();
    }

    const dto = {
      areaName: AREA_A,
    } as UpdateInventoryAreaDto;

    const result = await validator.validateUpdateNode('root', dto, area.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
  });
});
