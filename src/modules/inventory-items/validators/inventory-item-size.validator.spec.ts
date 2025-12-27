import { NotImplementedException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { UnitOfMeasureService } from '../../unit-of-measure/services/unit-of-measure.service';
import { GRAM } from '../../unit-of-measure/utils/constants';
import { UpdateInventoryItemSizeDto } from '../dto/inventory-item-size/update-inventory-item-size.dto';
import { InventoryItemPackageService } from '../services/inventory-item-package.service';
import { InventoryItemSizeService } from '../services/inventory-item-size.service';
import { FOOD_A, OTHER_PKG } from '../utils/constants';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemSizeValidator } from './inventory-item-size.validator';

describe('inventory item package validator', () => {
  let testingUtil: InventoryItemTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: InventoryItemSizeValidator;
  let service: InventoryItemSizeService;

  let unitService: UnitOfMeasureService;
  let packageService: InventoryItemPackageService;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();
    validator = module.get<InventoryItemSizeValidator>(
      InventoryItemSizeValidator,
    );
    service = module.get<InventoryItemSizeService>(InventoryItemSizeService);
    unitService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
    packageService = module.get<InventoryItemPackageService>(
      InventoryItemPackageService,
    );

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<InventoryItemTestingUtil>(
      InventoryItemTestingUtil,
    );
    await testingUtil.initInventoryItemSizeTestDatabase(dbTestContext);
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
