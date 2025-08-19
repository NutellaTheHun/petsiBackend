import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { EXIST } from '../../../util/exceptions/error_constants';
import { ValidationException } from '../../../util/exceptions/validation-exception';
import { CreateInventoryItemPackageDto } from '../dto/inventory-item-package/create-inventory-item-package.dto';
import { UpdateInventoryItemPackageDto } from '../dto/inventory-item-package/update-inventory-item-package.dto';
import { InventoryItemPackageService } from '../services/inventory-item-package.service';
import { BAG_PKG, PACKAGE_PKG } from '../utils/constants';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemPackageValidator } from './inventory-item-package.validator';

describe('inventory item package validator', () => {
  let testingUtil: InventoryItemTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: InventoryItemPackageValidator;

  let service: InventoryItemPackageService;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();
    validator = module.get<InventoryItemPackageValidator>(
      InventoryItemPackageValidator,
    );

    service = module.get<InventoryItemPackageService>(
      InventoryItemPackageService,
    );

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<InventoryItemTestingUtil>(
      InventoryItemTestingUtil,
    );
    await testingUtil.initInventoryItemPackageTestDatabase(dbTestContext);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  it('should validate create', async () => {
    const dto = {
      packageName: 'CREATE TEST',
    } as CreateInventoryItemPackageDto;

    await validator.validateCreate(dto);
  });

  it('should fail create (name already exists)', async () => {
    const dto = {
      packageName: BAG_PKG,
    } as CreateInventoryItemPackageDto;

    try {
      await validator.validateCreate(dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(EXIST);
    }
  });

  it('should validate update', async () => {
    const toUpdate = await service.findOneByName(BAG_PKG);
    if (!toUpdate) {
      throw new Error();
    }

    const dto = {
      itemCategoryName: 'UPDATE TEST',
    } as UpdateInventoryItemPackageDto;

    validator.validateUpdate(toUpdate.id, dto);
  });

  it('should fail update (name already exists)', async () => {
    const toUpdate = await service.findOneByName(BAG_PKG);
    if (!toUpdate) {
      throw new Error();
    }

    const dto = {
      packageName: PACKAGE_PKG,
    } as UpdateInventoryItemPackageDto;

    try {
      await validator.validateUpdate(toUpdate.id, dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(EXIST);
    }
  });
});
