import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryAreaDto } from '../dto/inventory-area/create-inventory-area.dto';
import { UpdateInventoryAreaDto } from '../dto/inventory-area/update-inventory-area.dto';
import { InventoryArea } from '../entities/inventory-area.entity';
import { AREA_A } from '../utils/constants';
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

  it('should validate create', async () => {
    const dto = {
      name: 'testValidateArea',
    } as CreateInventoryAreaDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should fail create (name already exists)', async () => {
    const dto = {
      name: AREA_A,
    } as CreateInventoryAreaDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('areaName');
  });

  it('should pass update', async () => {
    const area = await service.findOneByName(AREA_A);
    if (!area) {
      throw new Error();
    }

    const dto = {
      name: 'testValidateArea',
    } as UpdateInventoryAreaDto;

    await validator.validateUpdateNode('root', dto, area.id);
  });

  it('should fail update (name already exists)', async () => {
    const area = await service.findOneByName(AREA_A);
    if (!area) {
      throw new Error();
    }

    const dto = {
      name: AREA_A,
    } as UpdateInventoryAreaDto;

    const result = await validator.validateUpdateNode('root', dto, area.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('areaName');
  });
});
