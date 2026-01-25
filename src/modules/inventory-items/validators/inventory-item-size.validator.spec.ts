import { NotImplementedException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { GRAM } from '../../unit-of-measure/utils/constants';
import { UpdateInventoryItemSizeDto } from '../dto/inventory-item-size/update-inventory-item-size.dto';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { FOOD_A, OTHER_PKG } from '../utils/constants';
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

  it('should pass create validation', async () => {
    throw new NotImplementedException();
  });

  it('should validate update', async () => {
    const toUpdate = await service.findSizesByItemName(FOOD_A);
    if (!toUpdate) {
      throw new Error();
    }

    const unit = await unitService.findOneByName(GRAM);
    if (!unit) {
      throw new Error();
    }
    const pkg = await packageService.findOneByName(OTHER_PKG);
    if (!pkg) {
      throw new Error();
    }

    const dto = {
      measureTypeId: unit.id,
      measureAmount: 1,
      packageId: pkg.id,
      cost: 5,
    } as UpdateInventoryItemSizeDto;

    const result = await validator.validateUpdateNode(
      'root',
      dto,
      toUpdate[0].id,
    );
    expect(result).toBeNull();
  });

  it('should fail update (already exists)', async () => {
    const toUpdate = await service.findSizesByItemName(FOOD_A);
    if (!toUpdate) {
      throw new Error();
    }

    const badItem = await service.findOne(toUpdate[0].id, [
      'measureUnit',
      'packageType',
    ]);

    const dto = {
      measureTypeId: badItem.measureType.id,
      measureAmount: 1,
      packageId: badItem.package.id,
      cost: 5,
    } as UpdateInventoryItemSizeDto;
    const result = await validator.validateUpdateNode('root', dto, badItem.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(['packageType', 'measureUnit']).toContain(result?.field);
  });
});
