import { TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { UnitOfMeasureService } from '../../unit-of-measure/services/unit-of-measure.service';
import { KILOGRAM, POUND } from '../../unit-of-measure/utils/constants';
import { NestedInventoryItemSizeDto } from '../dto/inventory-item-size/nested-inventory-item-size.dto';
import { CreateInventoryItemDto } from '../dto/inventory-item/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/inventory-item/update-inventory-item.dto';
import { InventoryItemCategoryService } from '../services/inventory-item-category.service';
import { InventoryItemPackageService } from '../services/inventory-item-package.service';
import { InventoryItemVendorService } from '../services/inventory-item-vendor.service';
import { InventoryItemService } from '../services/inventory-item.service';
import {
  BOX_PKG,
  CAN_PKG,
  DAIRY_CAT,
  FOOD_A,
  VENDOR_A,
} from '../utils/constants';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemValidator } from './inventory-item.validator';

describe('inventory item validator', () => {
  let testingUtil: InventoryItemTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: InventoryItemValidator;
  let itemService: InventoryItemService;

  let categoryService: InventoryItemCategoryService;
  let vendorService: InventoryItemVendorService;
  let unitService: UnitOfMeasureService;
  let packageService: InventoryItemPackageService;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();
    validator = module.get<InventoryItemValidator>(InventoryItemValidator);

    itemService = module.get<InventoryItemService>(InventoryItemService);
    categoryService = module.get<InventoryItemCategoryService>(
      InventoryItemCategoryService,
    );
    vendorService = module.get<InventoryItemVendorService>(
      InventoryItemVendorService,
    );
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

  it('should validate create', async () => {
    const unitPound = await unitService.findOneByName(POUND);
    if (!unitPound) {
      throw new Error();
    }
    const unitKilo = await unitService.findOneByName(KILOGRAM);
    if (!unitKilo) {
      throw new Error();
    }
    const pkgBox = await packageService.findOneByName(BOX_PKG);
    if (!pkgBox) {
      throw new Error();
    }
    const pkgCan = await packageService.findOneByName(CAN_PKG);
    if (!pkgCan) {
      throw new Error();
    }

    const sizeDtos = [
      plainToInstance(NestedInventoryItemSizeDto, {
        mode: 'create',
        createDto: {
          measureUnitId: unitPound.id,
          measureAmount: 1,
          inventoryPackageId: pkgBox.id,
          cost: 1,
        },
      }),
      plainToInstance(NestedInventoryItemSizeDto, {
        mode: 'create',
        createDto: {
          measureUnitId: unitKilo.id,
          measureAmount: 1,
          inventoryPackageId: pkgCan.id,
          cost: 1,
        },
      }),
    ];

    const category = await categoryService.findOneByName(DAIRY_CAT);
    if (!category) {
      throw new Error();
    }
    const vendor = await vendorService.findOneByName(VENDOR_A);
    if (!vendor) {
      throw new Error();
    }

    const dto = {
      name: 'test item',
      categoryId: category.id,
      vendorId: vendor.id,
      sizes: sizeDtos,
    } as CreateInventoryItemDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should fail create (name already exists)', async () => {
    const unitPound = await unitService.findOneByName(POUND);
    if (!unitPound) {
      throw new Error();
    }
    const unitKilo = await unitService.findOneByName(KILOGRAM);
    if (!unitKilo) {
      throw new Error();
    }
    const pkgBox = await packageService.findOneByName(BOX_PKG);
    if (!pkgBox) {
      throw new Error();
    }
    const pkgCan = await packageService.findOneByName(CAN_PKG);
    if (!pkgCan) {
      throw new Error();
    }

    const sizeDtos = [
      plainToInstance(NestedInventoryItemSizeDto, {
        mode: 'create',
        createDto: {
          measureUnitId: unitPound.id,
          measureAmount: 1,
          inventoryPackageId: pkgBox.id,
          cost: 1,
        },
      }),
      plainToInstance(NestedInventoryItemSizeDto, {
        mode: 'create',
        createDto: {
          measureUnitId: unitKilo.id,
          measureAmount: 1,
          inventoryPackageId: pkgCan.id,
          cost: 1,
        },
      }),
    ];

    const category = await categoryService.findOneByName(DAIRY_CAT);
    if (!category) {
      throw new Error();
    }
    const vendor = await vendorService.findOneByName(VENDOR_A);
    if (!vendor) {
      throw new Error();
    }

    const dto = {
      name: FOOD_A,
      categoryId: category.id,
      vendorId: vendor.id,
      sizes: sizeDtos,
    } as CreateInventoryItemDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('itemName');
  });

  // Noting to validate for create?
  /*it('should fail create: InventoryItemSize Validator', async () => {
    throw new NotImplementedException();
  });*/

  it('should validate update', async () => {
    const unitPound = await unitService.findOneByName(POUND);
    if (!unitPound) {
      throw new Error();
    }
    const unitKilo = await unitService.findOneByName(KILOGRAM);
    if (!unitKilo) {
      throw new Error();
    }
    const pkgBox = await packageService.findOneByName(BOX_PKG);
    if (!pkgBox) {
      throw new Error();
    }
    const pkgCan = await packageService.findOneByName(CAN_PKG);
    if (!pkgCan) {
      throw new Error();
    }

    const toUpdate = await itemService.findOneByName(FOOD_A, ['itemSizes']);
    if (!toUpdate) {
      throw new Error();
    }

    const sizeDtos = [
      plainToInstance(NestedInventoryItemSizeDto, {
        mode: 'create',
        createDto: {
          measureUnitId: unitPound.id,
          measureAmount: 1,
          inventoryPackageId: pkgBox.id,
          cost: 1,
        },
      }),
      plainToInstance(NestedInventoryItemSizeDto, {
        mode: 'update',
        id: toUpdate.sizes[0].id,
        updateDto: {
          measureUnitId: unitKilo.id,
          measureAmount: 1,
          inventoryPackageId: pkgCan.id,
          cost: 1,
        },
      }),
    ];

    const category = await categoryService.findOneByName(DAIRY_CAT);
    if (!category) {
      throw new Error();
    }
    const vendor = await vendorService.findOneByName(VENDOR_A);
    if (!vendor) {
      throw new Error();
    }

    const dto = {
      name: 'UPDATE ITEM NAME',
      categoryId: category.id,
      vendorId: vendor.id,
      sizes: sizeDtos,
    } as UpdateInventoryItemDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeNull();
  });

  it('should fail validate update (name exists)', async () => {
    const unitPound = await unitService.findOneByName(POUND);
    if (!unitPound) {
      throw new Error();
    }
    const unitKilo = await unitService.findOneByName(KILOGRAM);
    if (!unitKilo) {
      throw new Error();
    }
    const pkgBox = await packageService.findOneByName(BOX_PKG);
    if (!pkgBox) {
      throw new Error();
    }
    const pkgCan = await packageService.findOneByName(CAN_PKG);
    if (!pkgCan) {
      throw new Error();
    }

    const toUpdate = await itemService.findOneByName(FOOD_A, ['itemSizes']);
    if (!toUpdate) {
      throw new Error();
    }

    const sizeDtos = [
      plainToInstance(NestedInventoryItemSizeDto, {
        mode: 'create',
        createDto: {
          measureUnitId: unitPound.id,
          measureAmount: 1,
          inventoryPackageId: pkgBox.id,
          cost: 1,
        },
      }),
      plainToInstance(NestedInventoryItemSizeDto, {
        mode: 'update',
        id: toUpdate.sizes[0].id,
        updateDto: {
          measureUnitId: unitKilo.id,
          measureAmount: 1,
          inventoryPackageId: pkgCan.id,
          cost: 1,
        },
      }),
    ];

    const category = await categoryService.findOneByName(DAIRY_CAT);
    if (!category) {
      throw new Error();
    }
    const vendor = await vendorService.findOneByName(VENDOR_A);
    if (!vendor) {
      throw new Error();
    }

    const dto = {
      name: FOOD_A,
      categoryId: category.id,
      vendorId: vendor.id,
      sizes: sizeDtos,
    } as UpdateInventoryItemDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('itemName');
  });

  it('should fail update: InventoryItemSize Validation: combination already exists', async () => {
    const unitPound = await unitService.findOneByName(POUND);
    if (!unitPound) {
      throw new Error();
    }
    const unitKilo = await unitService.findOneByName(KILOGRAM);
    if (!unitKilo) {
      throw new Error();
    }
    const pkgBox = await packageService.findOneByName(BOX_PKG);
    if (!pkgBox) {
      throw new Error();
    }
    const pkgCan = await packageService.findOneByName(CAN_PKG);
    if (!pkgCan) {
      throw new Error();
    }

    const toUpdate = await itemService.findOneByName(FOOD_A, ['itemSizes']);
    if (!toUpdate) {
      throw new Error();
    }

    const sizeDtos = [
      plainToInstance(NestedInventoryItemSizeDto, {
        mode: 'update',
        id: toUpdate.sizes[0].id,
        updateDto: {
          measureUnitId: unitKilo.id,
          measureAmount: 1,
          inventoryPackageId: pkgCan.id,
          cost: 1,
        },
      }),
    ];

    const category = await categoryService.findOneByName(DAIRY_CAT);
    if (!category) {
      throw new Error();
    }
    const vendor = await vendorService.findOneByName(VENDOR_A);
    if (!vendor) {
      throw new Error();
    }

    const dto = {
      name: 'UPDATE ITEM NAME',
      categoryId: category.id,
      vendorId: vendor.id,
      sizes: sizeDtos,
    } as UpdateInventoryItemDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.field).toEqual('itemSizes');
    expect(result?.children[0].children.length).toEqual(1);
  });
});
