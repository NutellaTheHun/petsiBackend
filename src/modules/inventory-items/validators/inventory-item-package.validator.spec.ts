import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
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
      name: 'CREATE TEST',
    } as CreateInventoryItemPackageDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should fail create (name already exists)', async () => {
    const dto = {
      name: BAG_PKG,
    } as CreateInventoryItemPackageDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('packageName');
  });

  it('should validate update', async () => {
    const toUpdate = await service.findOneByName(BAG_PKG);
    if (!toUpdate) {
      throw new Error();
    }

    const dto = {
      itemCategoryName: 'UPDATE TEST',
    } as UpdateInventoryItemPackageDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeNull();
  });

  it('should fail update (name already exists)', async () => {
    const toUpdate = await service.findOneByName(BAG_PKG);
    if (!toUpdate) {
      throw new Error();
    }

    const dto = {
      name: PACKAGE_PKG,
    } as UpdateInventoryItemPackageDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('packageName');
  });
});
