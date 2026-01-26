import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { expectValidationMessage } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItemPackage } from '../../inventory-items/entities/inventory-item-package.entity';
import { InventoryItemSize } from '../../inventory-items/entities/inventory-item-size.entity';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import {
  DRY_C,
  FOOD_A,
  FOOD_B,
  FOOD_C,
  PACKAGE_PKG,
} from '../../inventory-items/utils/constants';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { POUND } from '../../unit-of-measure/utils/constants';
import { CreateInventoryAreaItemDto } from '../dto/inventory-area-item/create-inventory-area-item.dto';
import { UpdateInventoryAreaItemDto } from '../dto/inventory-area-item/update-inventory-area-item.dto';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryAreaItem } from '../entities/inventory-area-item.entity';
import { AREA_A, AREA_B, AREA_C } from '../utils/constants';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaItemValidator } from './inventory-area-item.validator';

describe('inventory area item validator', () => {
  let testingUtil: InventoryAreaTestUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: InventoryAreaItemValidator;

  let areaItemRepo: Repository<InventoryAreaItem>;
  let areaCountRepo: Repository<InventoryAreaCount>;
  let itemRepo: Repository<InventoryItem>;
  let itemSizeRepo: Repository<InventoryItemSize>;

  let measureRepo: Repository<UnitOfMeasure>;
  let packageRepo: Repository<InventoryItemPackage>;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryAreasTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
    await testingUtil.initInventoryAreaItemCountTestDatabase(dbTestContext);

    validator = module.get<InventoryAreaItemValidator>(
      InventoryAreaItemValidator,
    );

    areaItemRepo = module.get(getRepositoryToken(InventoryAreaItem));
    areaCountRepo = module.get(getRepositoryToken(InventoryAreaCount));
    itemRepo = module.get(getRepositoryToken(InventoryItem));
    itemSizeRepo = module.get(getRepositoryToken(InventoryItemSize));
    measureRepo = module.get(getRepositoryToken(UnitOfMeasure));
    packageRepo = module.get(getRepositoryToken(InventoryItemPackage));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  // Create Validation Tests
  it('successfully validate create with no validation errors', async () => {
    const count = await areaCountRepo.findOne({
      where: { inventoryArea: { name: AREA_A } },
    });
    if (!count) {
      throw new Error('count not found');
    }
    const food_a = await itemRepo.findOne({
      where: { name: FOOD_A },
      relations: ['sizes'],
    });
    if (!food_a) {
      throw new Error('item not found');
    }
    if (!food_a.sizes || food_a.sizes.length === 0) {
      throw new Error('item sizes not found');
    }
    const pkg = await packageRepo.findOne({ where: { name: PACKAGE_PKG } });
    if (!pkg) {
      throw new Error('package not found');
    }
    const uom = await measureRepo.findOne({ where: { name: POUND } });
    if (!uom) {
      throw new Error('uom not found');
    }

    const dto: CreateInventoryAreaItemDto = {
      countedInventoryItemId: food_a.id,
      amount: 2,
      countedItemSizeId: food_a.sizes[0].id,
      parentInventoryCountId: count.id,
    };

    const errors = await validator.validateCreateNode(dto);
    expect(errors).toBeNull();
  });

  it('fail validate create: amount with value 0', async () => {
    const count = await areaCountRepo.findOne({
      where: { inventoryArea: { name: AREA_A } },
    });
    if (!count) {
      throw new Error('count not found');
    }
    const food_a = await itemRepo.findOne({
      where: { name: FOOD_A },
      relations: ['sizes'],
    });
    if (!food_a) {
      throw new Error('item not found');
    }
    if (!food_a.sizes || food_a.sizes.length === 0) {
      throw new Error('item sizes not found');
    }

    const dto: CreateInventoryAreaItemDto = {
      countedInventoryItemId: food_a.id,
      amount: 0,
      countedItemSizeId: food_a.sizes[0].id,
      parentInventoryCountId: count.id,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'amount' }],
      'Amount must be greater than 0',
    );
  });

  it('fail validate create: inventoryItemSizeId and countedItemSize both provided', async () => {
    const count = await areaCountRepo.findOne({
      where: { inventoryArea: { name: AREA_A } },
    });
    if (!count) {
      throw new Error('count not found');
    }
    const food_a = await itemRepo.findOne({
      where: { name: FOOD_A },
      relations: ['sizes'],
    });
    if (!food_a) {
      throw new Error('item not found');
    }
    if (!food_a.sizes || food_a.sizes.length === 0) {
      throw new Error('item sizes not found');
    }
    const pkg = await packageRepo.findOne({ where: { name: PACKAGE_PKG } });
    if (!pkg) {
      throw new Error('package not found');
    }
    const uom = await measureRepo.findOne({ where: { name: POUND } });
    if (!uom) {
      throw new Error('uom not found');
    }

    const dto: CreateInventoryAreaItemDto = {
      countedInventoryItemId: food_a.id,
      amount: 2,
      countedItemSizeId: food_a.sizes[0].id,
      countedItemSize: {
        createId: 'c1',
        packageId: pkg.id,
        measureTypeId: uom.id,
        measureAmount: 1,
        cost: 1.99,
      },
      parentInventoryCountId: count.id,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'countedItemSize' }],
      'Cannot provide both an existing and new item size',
    );
  });

  it('fail validate create: neither inventoryItemSizeId nor countedItemSize provided', async () => {
    const count = await areaCountRepo.findOne({
      where: { inventoryArea: { name: AREA_A } },
    });
    if (!count) {
      throw new Error('count not found');
    }
    const food_a = await itemRepo.findOne({
      where: { name: FOOD_A },
    });
    if (!food_a) {
      throw new Error('item not found');
    }

    const dto: CreateInventoryAreaItemDto = {
      countedInventoryItemId: food_a.id,
      amount: 2,
      parentInventoryCountId: count.id,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'countedItemSize' }],
      'Must provide an item size or a new item size',
    );
  });

  it('fail validate create: countedInventoryItemId with invalid countedItemSizeId', async () => {
    const count = await areaCountRepo.findOne({
      where: { inventoryArea: { name: AREA_C } },
    });
    if (!count) {
      throw new Error('count not found');
    }
    const food_c = await itemRepo.findOne({
      where: { name: FOOD_C },
    });
    if (!food_c) {
      throw new Error('item not found');
    }
    const food_b = await itemRepo.findOne({
      where: { name: FOOD_B },
      relations: ['sizes'],
    });
    if (!food_b) {
      throw new Error('item not found');
    }
    if (!food_b.sizes || food_b.sizes.length === 0) {
      throw new Error('item sizes not found');
    }

    const dto: CreateInventoryAreaItemDto = {
      countedInventoryItemId: food_c.id,
      amount: 1,
      countedItemSizeId: food_b.sizes[0].id,
      parentInventoryCountId: count.id,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'countedItemSize' }],
      'Invalid size for inventory item',
    );
  });

  it('fail validate create: nestedCreateInventoryItemSizeDto errors: measureAmount with value 0', async () => {
    const count = await areaCountRepo.findOne({
      where: { inventoryArea: { name: AREA_A } },
    });
    if (!count) {
      throw new Error('count not found');
    }
    const food_a = await itemRepo.findOne({
      where: { name: FOOD_A },
    });
    if (!food_a) {
      throw new Error('item not found');
    }
    const pkg = await packageRepo.findOne({ where: { name: PACKAGE_PKG } });
    if (!pkg) {
      throw new Error('package not found');
    }
    const uom = await measureRepo.findOne({ where: { name: POUND } });
    if (!uom) {
      throw new Error('uom not found');
    }

    const dto: CreateInventoryAreaItemDto = {
      countedInventoryItemId: food_a.id,
      amount: 2,
      countedItemSize: {
        createId: 'c1',
        packageId: pkg.id,
        measureTypeId: uom.id,
        measureAmount: 0,
        cost: 1.99,
      },
      parentInventoryCountId: count.id,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'countedItemSize', id: 'c1' }, { prop: 'measureAmount' }],
      'cannot be less than or equal to 0',
    );
  });

  it('fail validate create: nestedCreateInventoryItemSizeDto errors: cost with value 0', async () => {
    const count = await areaCountRepo.findOne({
      where: { inventoryArea: { name: AREA_A } },
    });
    if (!count) {
      throw new Error('count not found');
    }
    const food_a = await itemRepo.findOne({
      where: { name: FOOD_A },
    });
    if (!food_a) {
      throw new Error('item not found');
    }
    const pkg = await packageRepo.findOne({ where: { name: PACKAGE_PKG } });
    if (!pkg) {
      throw new Error('package not found');
    }
    const uom = await measureRepo.findOne({ where: { name: POUND } });
    if (!uom) {
      throw new Error('uom not found');
    }

    const dto: CreateInventoryAreaItemDto = {
      countedInventoryItemId: food_a.id,
      amount: 2,
      countedItemSize: {
        createId: 'c1',
        packageId: pkg.id,
        measureTypeId: uom.id,
        measureAmount: 1,
        cost: -1,
      },
      parentInventoryCountId: count.id,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'countedItemSize', id: 'c1' }, { prop: 'cost' }],
      'cannot be less than or equal to 0',
    );
  });

  // Update Validation Tests
  it('successfully validate update with no validation errors', async () => {
    const itemToUpdate = await areaItemRepo.findOne({
      where: { parentInventoryCount: { inventoryArea: { name: AREA_A } } },
      relations: ['countedItem', 'countedItemSize'],
    });
    if (!itemToUpdate) {
      throw new Error('item not found');
    }

    const food_a = await itemRepo.findOne({
      where: { name: FOOD_A },
      relations: ['sizes'],
    });
    if (!food_a) {
      throw new Error('item not found');
    }
    if (!food_a.sizes || food_a.sizes.length === 0) {
      throw new Error('item sizes not found');
    }

    const dto: UpdateInventoryAreaItemDto = {
      countedInventoryItemId: food_a.id,
      amount: 5,
      countedItemSizeId: food_a.sizes[0].id,
    };

    const errors = await validator.validateUpdateNode(dto, itemToUpdate.id);
    expect(errors).toBeNull();
  });

  it('fail validate update: amount with value 0', async () => {
    const itemToUpdate = await areaItemRepo.findOne({
      where: { parentInventoryCount: { inventoryArea: { name: AREA_A } } },
    });
    if (!itemToUpdate) {
      throw new Error('item not found');
    }

    const dto: UpdateInventoryAreaItemDto = {
      amount: 0,
    };

    const errors = await validator.validateUpdateNode(dto, itemToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'amount' }],
      'Amount must be greater than 0',
    );
  });

  it('fail validate update: countedItemSizeId with invalid for existing countedInventoryItem', async () => {
    const itemToUpdate = await areaItemRepo.findOne({
      where: { parentInventoryCount: { inventoryArea: { name: AREA_A } } },
      relations: ['countedItem'],
    });
    if (!itemToUpdate) {
      throw new Error('item not found');
    }

    const dry_c = await itemRepo.findOne({
      where: { name: DRY_C },
      relations: ['sizes'],
    });
    if (!dry_c) {
      throw new Error('item not found');
    }
    if (!dry_c.sizes || dry_c.sizes.length === 0) {
      throw new Error('item sizes not found');
    }

    const dto: UpdateInventoryAreaItemDto = {
      countedItemSizeId: dry_c.sizes[0].id,
    };

    const errors = await validator.validateUpdateNode(dto, itemToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'countedItemSize' }],
      'Invalid size for inventory item',
    );
  });

  it('fail validate update: countedInventoryItemId with invalid countedItemSizeId', async () => {
    const itemToUpdate = await areaItemRepo.findOne({
      where: { parentInventoryCount: { inventoryArea: { name: AREA_A } } },
    });
    if (!itemToUpdate) {
      throw new Error('item not found');
    }

    const food_c = await itemRepo.findOne({
      where: { name: FOOD_C },
    });
    if (!food_c) {
      throw new Error('item not found');
    }
    const food_b = await itemRepo.findOne({
      where: { name: FOOD_B },
      relations: ['sizes'],
    });
    if (!food_b) {
      throw new Error('item not found');
    }
    if (!food_b.sizes || food_b.sizes.length === 0) {
      throw new Error('item sizes not found');
    }

    const dto: UpdateInventoryAreaItemDto = {
      countedInventoryItemId: food_c.id,
      countedItemSizeId: food_b.sizes[0].id,
    };

    const errors = await validator.validateUpdateNode(dto, itemToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'countedItemSize' }],
      'Invalid size for inventory item',
    );
  });

  it('fail validate update: countedItemSizeId and countedItemSize both provided', async () => {
    const itemToUpdate = await areaItemRepo.findOne({
      where: { parentInventoryCount: { inventoryArea: { name: AREA_A } } },
      relations: ['countedItem', 'countedItemSize'],
    });
    if (!itemToUpdate) {
      throw new Error('item not found');
    }
    if (!itemToUpdate.countedItemSize) {
      throw new Error('item size not found');
    }

    const pkg = await packageRepo.findOne({ where: { name: PACKAGE_PKG } });
    if (!pkg) {
      throw new Error('package not found');
    }
    const uom = await measureRepo.findOne({ where: { name: POUND } });
    if (!uom) {
      throw new Error('uom not found');
    }

    const dto: UpdateInventoryAreaItemDto = {
      countedItemSizeId: itemToUpdate.countedItemSize.id,
      countedItemSize: {
        createId: 'c1',
        packageId: pkg.id,
        measureTypeId: uom.id,
        measureAmount: 1,
        cost: 1.99,
      },
    };

    const errors = await validator.validateUpdateNode(dto, itemToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'countedItemSize' }],
      'Cannot provide both an existing and new item size',
    );
  });

  it('fail validate update: countedInventoryItemId with no sizeId or sizeDto', async () => {
    const itemToUpdate = await areaItemRepo.findOne({
      where: { parentInventoryCount: { inventoryArea: { name: AREA_A } } },
    });
    if (!itemToUpdate) {
      throw new Error('item not found');
    }

    const food_a = await itemRepo.findOne({
      where: { name: FOOD_A },
    });
    if (!food_a) {
      throw new Error('item not found');
    }

    const dto: UpdateInventoryAreaItemDto = {
      countedInventoryItemId: food_a.id,
    };

    const errors = await validator.validateUpdateNode(dto, itemToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'countedItemSize' }],
      'Must provide an item size or a new item size',
    );
  });

  it('fail validate update: nestedUpdateInventoryItemSizeDto errors: measureAmount with value 0', async () => {
    const itemToUpdate = await areaItemRepo.findOne({
      where: { parentInventoryCount: { inventoryArea: { name: AREA_A } } },
      relations: ['countedItemSize'],
    });
    if (!itemToUpdate) {
      throw new Error('item not found');
    }
    if (!itemToUpdate.countedItemSize) {
      throw new Error('item size not found');
    }

    const pkg = await packageRepo.findOne({ where: { name: PACKAGE_PKG } });
    if (!pkg) {
      throw new Error('package not found');
    }
    const uom = await measureRepo.findOne({ where: { name: POUND } });
    if (!uom) {
      throw new Error('uom not found');
    }

    const dto: UpdateInventoryAreaItemDto = {
      countedItemSize: {
        id: itemToUpdate.countedItemSize.id,
        measureAmount: 0,
      },
    };

    const errors = await validator.validateUpdateNode(dto, itemToUpdate.id);
    expectValidationMessage(
      errors,
      [
        { prop: 'countedItemSize', id: itemToUpdate.countedItemSize.id },
        { prop: 'measureAmount' },
      ],
      'cannot be less than or equal to 0',
    );
  });

  it('fail validate update: nestedUpdateInventoryItemSizeDto errors: cost with value 0', async () => {
    const itemToUpdate = await areaItemRepo.findOne({
      where: { parentInventoryCount: { inventoryArea: { name: AREA_A } } },
      relations: ['countedItemSize'],
    });
    if (!itemToUpdate) {
      throw new Error('item not found');
    }
    if (!itemToUpdate.countedItemSize) {
      throw new Error('item size not found');
    }

    const dto: UpdateInventoryAreaItemDto = {
      countedItemSize: {
        id: itemToUpdate.countedItemSize.id,
        cost: -1,
      },
    };

    const errors = await validator.validateUpdateNode(dto, itemToUpdate.id);
    expectValidationMessage(
      errors,
      [
        { prop: 'countedItemSize', id: itemToUpdate.countedItemSize.id },
        { prop: 'cost' },
      ],
      'cannot be less than or equal to 0',
    );
  });

  it('fail validate update: nestedUpdateInventoryItemSizeDto errors: already exists', async () => {
    const itemToUpdate = await areaItemRepo.findOne({
      where: { parentInventoryCount: { inventoryArea: { name: AREA_A } } },
      relations: ['countedItem', 'countedItemSize'],
    });
    if (!itemToUpdate) {
      throw new Error('item not found');
    }
    if (!itemToUpdate.countedItemSize) {
      throw new Error('item size not found');
    }

    // Find another size with the same item that has different package/measureType
    const existingSizes = await itemSizeRepo.find({
      where: { inventoryItem: { id: itemToUpdate.countedItem.id } },
      relations: ['package', 'measureType'],
    });

    // Find a size that exists but is different from the current one
    const targetSize = existingSizes.find(
      (size) => size.id !== itemToUpdate.countedItemSize.id,
    );

    if (!targetSize) {
      throw new Error('target size not found');
    }

    const dto: UpdateInventoryAreaItemDto = {
      countedItemSize: {
        id: itemToUpdate.countedItemSize.id,
        packageId: targetSize.package.id,
        measureTypeId: targetSize.measureType.id,
      },
    };

    const errors = await validator.validateUpdateNode(dto, itemToUpdate.id);
    expectValidationMessage(
      errors,
      [
        { prop: 'countedItemSize', id: itemToUpdate.countedItemSize.id },
        { prop: 'package' },
      ],
      'Inventory item size already exists',
    );
  });
});
