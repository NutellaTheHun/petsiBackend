import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { expectValidationMessage } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItemPackage } from '../../inventory-items/entities/inventory-item-package.entity';
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
import { CreateInventoryAreaCountDto } from '../dto/inventory-area-count/create-inventory-area-count.dto';
import { UpdateInventoryAreaCountDto } from '../dto/inventory-area-count/update-inventory-area-count.dto';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryArea } from '../entities/inventory-area.entity';
import { AREA_A, AREA_B, AREA_C } from '../utils/constants';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaCountValidator } from './inventory-area-count.validator';

describe('inventory area count validator', () => {
  let testingUtil: InventoryAreaTestUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: InventoryAreaCountValidator;
  let countRepo: Repository<InventoryAreaCount>;
  let areaRepo: Repository<InventoryArea>;
  let itemRepo: Repository<InventoryItem>;
  let packageRepo: Repository<InventoryItemPackage>;
  let uomRepo: Repository<UnitOfMeasure>;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryAreasTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
    await testingUtil.initInventoryAreaItemCountTestDatabase(dbTestContext);

    validator = module.get<InventoryAreaCountValidator>(
      InventoryAreaCountValidator,
    );

    countRepo = module.get(getRepositoryToken(InventoryAreaCount));
    areaRepo = module.get(getRepositoryToken(InventoryArea));
    itemRepo = module.get(getRepositoryToken(InventoryItem));
    packageRepo = module.get(getRepositoryToken(InventoryItemPackage));
    uomRepo = module.get(getRepositoryToken(UnitOfMeasure));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  // Create Validation Tests
  it('successfully validate create no validation errors', async () => {
    const area = await areaRepo.findOne({ where: { name: AREA_A } });
    if (!area) {
      throw new Error('area not found');
    }
    const food_a = await itemRepo.findOne({
      where: { name: FOOD_A },
      relations: ['sizes'],
    });
    if (!food_a) {
      throw new Error('item not found');
    }
    if (!food_a.sizes) {
      throw new Error('item sizes not found');
    }
    const food_b = await itemRepo.findOne({
      where: { name: FOOD_B },
      relations: ['sizes'],
    });
    if (!food_b) {
      throw new Error('item not found');
    }
    if (!food_b.sizes) {
      throw new Error('item sizes not found');
    }
    const pkg = await packageRepo.findOne({ where: { name: PACKAGE_PKG } });
    if (!pkg) {
      throw new Error('package not found');
    }
    const uom = await uomRepo.findOne({ where: { name: POUND } });
    if (!uom) {
      throw new Error('uom not found');
    }

    const dto: CreateInventoryAreaCountDto = {
      inventoryAreaId: area.id,
      countedInventoryItems: [
        {
          createId: 'c1',
          countedInventoryItemId: food_a.id,
          amount: 2,
          countedItemSizeId: food_a.sizes[0].id,
        },
        {
          createId: 'c2',
          countedInventoryItemId: food_b.id,
          amount: 3,
          countedItemSize: {
            createId: 'c3',
            packageId: pkg.id,
            measureTypeId: uom.id,
            measureAmount: 1,
            cost: 1.99,
          },
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expect(errors).toBeNull();
  });

  it('fail validate create: no counted inventory items', async () => {
    const area = await areaRepo.findOne({ where: { name: AREA_A } });
    if (!area) {
      throw new Error('area not found');
    }
    const dto: CreateInventoryAreaCountDto = {
      inventoryAreaId: area.id,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'countedInventoryItems' }],
      'Inventory count has no counted items',
    );
  });

  it('fail validate create: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.amount with value 0', async () => {
    const area = await areaRepo.findOne({ where: { name: AREA_B } });
    if (!area) {
      throw new Error('area not found');
    }
    const food_b = await itemRepo.findOne({
      where: { name: FOOD_B },
      relations: ['sizes'],
    });
    if (!food_b) {
      throw new Error('item not found');
    }
    if (!food_b.sizes) {
      throw new Error('item sizes not found');
    }
    const dto: CreateInventoryAreaCountDto = {
      inventoryAreaId: area.id,
      countedInventoryItems: [
        {
          createId: 'c1',
          countedInventoryItemId: food_b.id,
          amount: 0,
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'countedInventoryItems', id: 'c1' }, { prop: 'amount' }],
      'Inventory count item amount must be greater than 0',
    );
  });

  it('fail validate create: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSizeId with invalid countedInventoryItemId', async () => {
    const area = await areaRepo.findOne({ where: { name: AREA_C } });
    if (!area) {
      throw new Error('area not found');
    }
    const food_c = await itemRepo.findOne({
      where: { name: FOOD_C },
    });
    if (!food_c) {
      throw new Error('item not found');
    }
    if (!food_c.sizes) {
      throw new Error('item sizes not found');
    }
    const food_b = await itemRepo.findOne({
      where: { name: FOOD_B },
      relations: ['sizes'],
    });
    if (!food_b) {
      throw new Error('item not found');
    }
    if (!food_b.sizes) {
      throw new Error('item sizes not found');
    }

    const dto: CreateInventoryAreaCountDto = {
      inventoryAreaId: area.id,
      countedInventoryItems: [
        {
          createId: 'c1',
          countedInventoryItemId: food_c.id,
          amount: 1,
          countedItemSizeId: food_b.sizes[0].id,
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [
        { prop: 'countedInventoryItems', id: 'c1' },
        { prop: 'countedItemSizeId' },
      ],
      'Invalid size for inventory item',
    );
  });

  it('fail validate create: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSize and inventoryAreaItem.countedItemSizeId both provided', async () => {
    const area = await areaRepo.findOne({ where: { name: AREA_A } });
    if (!area) {
      throw new Error('area not found');
    }
    const food_a = await itemRepo.findOne({
      where: { name: FOOD_A },
      relations: ['sizes'],
    });
    if (!food_a) {
      throw new Error('item not found');
    }
    if (!food_a.sizes) {
      throw new Error('item sizes not found');
    }
    const food_b = await itemRepo.findOne({
      where: { name: FOOD_B },
      relations: ['sizes'],
    });
    if (!food_b) {
      throw new Error('item not found');
    }
    if (!food_b.sizes) {
      throw new Error('item sizes not found');
    }
    const pkg = await packageRepo.findOne({ where: { name: PACKAGE_PKG } });
    if (!pkg) {
      throw new Error('package not found');
    }
    const uom = await uomRepo.findOne({ where: { name: POUND } });
    if (!uom) {
      throw new Error('uom not found');
    }

    const dto: CreateInventoryAreaCountDto = {
      inventoryAreaId: area.id,
      countedInventoryItems: [
        {
          createId: 'c1',
          countedInventoryItemId: food_a.id,
          amount: 2,
          countedItemSizeId: food_a.sizes[0].id,
          countedItemSize: {
            createId: 'c2',
            packageId: pkg.id,
            measureTypeId: uom.id,
            measureAmount: 1,
            cost: 1.99,
          },
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [
        { prop: 'countedInventoryItems', id: 'c1' },
        { prop: 'countedItemSize' },
      ],
      'Cannot provide both an existing and new item size',
    );
  });

  it('fail validate create: nestedCreateInventoryAreaItemDto errors: neither inventoryAreaItem.countedItemSize and inventoryAreaItem.countedItemSizeId not provided', async () => {
    const area = await areaRepo.findOne({ where: { name: AREA_A } });
    if (!area) {
      throw new Error('area not found');
    }
    const food_a = await itemRepo.findOne({
      where: { name: FOOD_A },
      relations: ['sizes'],
    });
    if (!food_a) {
      throw new Error('item not found');
    }
    if (!food_a.sizes) {
      throw new Error('item sizes not found');
    }

    const dto: CreateInventoryAreaCountDto = {
      inventoryAreaId: area.id,
      countedInventoryItems: [
        {
          createId: 'c1',
          countedInventoryItemId: food_a.id,
          amount: 2,
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [
        { prop: 'countedInventoryItems', id: 'c1' },
        { prop: 'countedItemSize' },
      ],
      'Must provide an item size or a new item size',
    );
  });

  it('fail validate create: nestedCreateInventoryAreaItemDto errors: nestedCreateInventoryItemSizeDto errors: measureAmount with value 0', async () => {
    const area = await areaRepo.findOne({ where: { name: AREA_A } });
    if (!area) {
      throw new Error('area not found');
    }
    const food_a = await itemRepo.findOne({
      where: { name: FOOD_A },
      relations: ['sizes'],
    });
    if (!food_a) {
      throw new Error('item not found');
    }
    if (!food_a.sizes) {
      throw new Error('item sizes not found');
    }
    const food_b = await itemRepo.findOne({
      where: { name: FOOD_B },
      relations: ['sizes'],
    });
    if (!food_b) {
      throw new Error('item not found');
    }
    if (!food_b.sizes) {
      throw new Error('item sizes not found');
    }
    const pkg = await packageRepo.findOne({ where: { name: PACKAGE_PKG } });
    if (!pkg) {
      throw new Error('package not found');
    }
    const uom = await uomRepo.findOne({ where: { name: POUND } });
    if (!uom) {
      throw new Error('uom not found');
    }

    const dto: CreateInventoryAreaCountDto = {
      inventoryAreaId: area.id,
      countedInventoryItems: [
        {
          createId: 'c1',
          countedInventoryItemId: food_a.id,
          amount: 2,
          countedItemSizeId: food_a.sizes[0].id,
        },
        {
          createId: 'c2',
          countedInventoryItemId: food_b.id,
          amount: 3,
          countedItemSize: {
            createId: 'c3',
            packageId: pkg.id,
            measureTypeId: uom.id,
            measureAmount: 0,
            cost: 1.99,
          },
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [
        { prop: 'countedInventoryItems', id: 'c2' },
        { prop: 'countedItemSize', id: 'c3' },
        { prop: 'measureAmount' },
      ],
      'cannot be less than or equal to 0',
    );
  });

  it('fail validate create: nestedCreateInventoryAreaItemDto errors: nestedCreateInventoryItemSizeDto errors: cost with value 0', async () => {
    const area = await areaRepo.findOne({ where: { name: AREA_A } });
    if (!area) {
      throw new Error('area not found');
    }
    const food_a = await itemRepo.findOne({
      where: { name: FOOD_A },
      relations: ['sizes'],
    });
    if (!food_a) {
      throw new Error('item not found');
    }
    if (!food_a.sizes) {
      throw new Error('item sizes not found');
    }
    const food_b = await itemRepo.findOne({
      where: { name: FOOD_B },
      relations: ['sizes'],
    });
    if (!food_b) {
      throw new Error('item not found');
    }
    if (!food_b.sizes) {
      throw new Error('item sizes not found');
    }
    const pkg = await packageRepo.findOne({ where: { name: PACKAGE_PKG } });
    if (!pkg) {
      throw new Error('package not found');
    }
    const uom = await uomRepo.findOne({ where: { name: POUND } });
    if (!uom) {
      throw new Error('uom not found');
    }

    const dto: CreateInventoryAreaCountDto = {
      inventoryAreaId: area.id,
      countedInventoryItems: [
        {
          createId: 'c1',
          countedInventoryItemId: food_a.id,
          amount: 2,
          countedItemSizeId: food_a.sizes[0].id,
        },
        {
          createId: 'c2',
          countedInventoryItemId: food_b.id,
          amount: 3,
          countedItemSize: {
            createId: 'c3',
            packageId: pkg.id,
            measureTypeId: uom.id,
            measureAmount: 1,
            cost: -1,
          },
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [
        { prop: 'countedInventoryItems', id: 'c2' },
        { prop: 'countedItemSize', id: 'c3' },
        { prop: 'cost' },
      ],
      'cannot be less than or equal to 0',
    );
  });

  // Update Validation Tests
  it('successfully validate update no validation errors', async () => {
    const countToUpdate = await countRepo.findOne({
      where: { inventoryArea: { name: AREA_A } },
    });
    if (!countToUpdate) {
      throw new Error('count not found');
    }
    const newArea = await areaRepo.findOne({ where: { name: AREA_B } });
    if (!newArea) {
      throw new Error('area not found');
    }

    const food_a = await itemRepo.findOne({
      where: { name: FOOD_A },
      relations: ['sizes'],
    });
    if (!food_a) {
      throw new Error('item not found');
    }
    if (!food_a.sizes) {
      throw new Error('item sizes not found');
    }

    const dto: UpdateInventoryAreaCountDto = {
      inventoryAreaId: newArea.id,
      countedInventoryItems: [
        {
          createId: 'c1',
          countedInventoryItemId: food_a.id,
          amount: 1,
          countedItemSizeId: food_a.sizes[0].id,
        },
      ],
    };

    const errors = await validator.validateUpdateNode(dto, countToUpdate.id);
    expect(errors).toBeNull();
  });

  it('fail validate update: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.amount with value 0', async () => {
    const countToUpdate = await countRepo.findOne({
      where: { inventoryArea: { name: AREA_A } },
    });
    if (!countToUpdate) {
      throw new Error('count not found');
    }
    const food_a = await itemRepo.findOne({
      where: { name: FOOD_A },
      relations: ['sizes'],
    });
    if (!food_a) {
      throw new Error('item not found');
    }
    if (!food_a.sizes) {
      throw new Error('item sizes not found');
    }

    const dto: UpdateInventoryAreaCountDto = {
      countedInventoryItems: [
        {
          createId: 'c1',
          countedInventoryItemId: food_a.id,
          amount: 0,
          countedItemSizeId: food_a.sizes[0].id,
        },
      ],
    };

    const errors = await validator.validateUpdateNode(dto, countToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'countedInventoryItems', id: 'c1' }, { prop: 'amount' }],
      'Amount must be greater than 0',
    );
  });

  it('fail validate update: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSizeId with invalid countedInventoryItemId', async () => {
    const countToUpdate = await countRepo.findOne({
      where: { inventoryArea: { name: AREA_A } },
    });
    if (!countToUpdate) {
      throw new Error('count not found');
    }
    const food_a = await itemRepo.findOne({
      where: { name: FOOD_A },
      relations: ['sizes'],
    });
    if (!food_a) {
      throw new Error('item not found');
    }
    if (!food_a.sizes) {
      throw new Error('item sizes not found');
    }
    const food_b = await itemRepo.findOne({
      where: { name: FOOD_B },
      relations: ['sizes'],
    });
    if (!food_b) {
      throw new Error('item not found');
    }
    if (!food_b.sizes) {
      throw new Error('item sizes not found');
    }

    const dto: UpdateInventoryAreaCountDto = {
      countedInventoryItems: [
        {
          createId: 'c1',
          countedInventoryItemId: food_a.id,
          amount: 1,
          countedItemSizeId: food_b.sizes[0].id,
        },
      ],
    };

    const errors = await validator.validateUpdateNode(dto, countToUpdate.id);
    expectValidationMessage(
      errors,
      [
        { prop: 'countedInventoryItems', id: 'c1' },
        { prop: 'countedItemSize' },
      ],
      'Invalid size for inventory item',
    );
  });

  it('fail validate update: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSize and inventoryAreaItem.countedItemSizeId both provided', async () => {
    const countToUpdate = await countRepo.findOne({
      where: { inventoryArea: { name: AREA_A } },
    });
    if (!countToUpdate) {
      throw new Error('count not found');
    }
    const food_a = await itemRepo.findOne({
      where: { name: FOOD_A },
      relations: ['sizes'],
    });
    if (!food_a) {
      throw new Error('item not found');
    }
    if (!food_a.sizes) {
      throw new Error('item sizes not found');
    }
    const pkg = await packageRepo.findOne({ where: { name: PACKAGE_PKG } });
    if (!pkg) {
      throw new Error('package not found');
    }
    const uom = await uomRepo.findOne({ where: { name: POUND } });
    if (!uom) {
      throw new Error('uom not found');
    }
    const dto: UpdateInventoryAreaCountDto = {
      countedInventoryItems: [
        {
          createId: 'c1',
          countedInventoryItemId: food_a.id,
          amount: 1,
          countedItemSizeId: food_a.sizes[0].id,
          countedItemSize: {
            createId: 'c2',
            packageId: pkg.id,
            measureTypeId: uom.id,
            measureAmount: 1,
            cost: 1.99,
          },
        },
      ],
    };
    const errors = await validator.validateUpdateNode(dto, countToUpdate.id);
    expectValidationMessage(
      errors,
      [
        { prop: 'countedInventoryItems', id: 'c1' },
        { prop: 'countedItemSize' },
      ],
      'Cannot provide both an existing and new item size',
    );
  });

  it('fail validate update: nestedCreateInventoryAreaItemDto errors: nestedCreateInventoryItemSizeDto errors: measureAmount with value 0', async () => {
    const countToUpdate = await countRepo.findOne({
      where: { inventoryArea: { name: AREA_A } },
    });
    if (!countToUpdate) {
      throw new Error('count not found');
    }
    const food_a = await itemRepo.findOne({
      where: { name: FOOD_A },
      relations: ['sizes'],
    });
    if (!food_a) {
      throw new Error('item not found');
    }
    if (!food_a.sizes) {
      throw new Error('item sizes not found');
    }
    const pkg = await packageRepo.findOne({ where: { name: PACKAGE_PKG } });
    if (!pkg) {
      throw new Error('package not found');
    }
    const uom = await uomRepo.findOne({ where: { name: POUND } });
    if (!uom) {
      throw new Error('uom not found');
    }
    const dto: UpdateInventoryAreaCountDto = {
      countedInventoryItems: [
        {
          createId: 'c1',
          countedInventoryItemId: food_a.id,
          amount: 1,
          countedItemSize: {
            createId: 'c2',
            packageId: pkg.id,
            measureTypeId: uom.id,
            measureAmount: 0,
            cost: 1.99,
          },
        },
      ],
    };
    const errors = await validator.validateUpdateNode(dto, countToUpdate.id);
    expectValidationMessage(
      errors,
      [
        { prop: 'countedInventoryItems', id: 'c1' },
        { prop: 'countedItemSize', id: 'c2' },
        { prop: 'measureAmount' },
      ],
      'cannot be less than or equal to 0',
    );
  });

  it('fail validate update: nestedCreateInventoryAreaItemDto errors: nestedCreateInventoryItemSizeDto errors: cost with value 0', async () => {
    const countToUpdate = await countRepo.findOne({
      where: { inventoryArea: { name: AREA_A } },
    });
    if (!countToUpdate) {
      throw new Error('count not found');
    }
    const food_a = await itemRepo.findOne({
      where: { name: FOOD_A },
      relations: ['sizes'],
    });
    if (!food_a) {
      throw new Error('item not found');
    }
    if (!food_a.sizes) {
      throw new Error('item sizes not found');
    }
    const pkg = await packageRepo.findOne({ where: { name: PACKAGE_PKG } });
    if (!pkg) {
      throw new Error('package not found');
    }
    const uom = await uomRepo.findOne({ where: { name: POUND } });
    if (!uom) {
      throw new Error('uom not found');
    }
    const dto: UpdateInventoryAreaCountDto = {
      countedInventoryItems: [
        {
          createId: 'c1',
          countedInventoryItemId: food_a.id,
          amount: 1,
          countedItemSize: {
            createId: 'c2',
            packageId: pkg.id,
            measureTypeId: uom.id,
            measureAmount: 1,
            cost: 0,
          },
        },
      ],
    };
    const errors = await validator.validateUpdateNode(dto, countToUpdate.id);
    expectValidationMessage(
      errors,
      [
        { prop: 'countedInventoryItems', id: 'c1' },
        { prop: 'countedItemSize', id: 'c2' },
        { prop: 'cost' },
      ],
      'cannot be less than or equal to 0',
    );
  });

  it('fail validate update: nestedUpdateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSizeId with invalid countedInventoryItemId', async () => {
    const countToUpdate = await countRepo.findOne({
      where: { inventoryArea: { name: AREA_A } },
      relations: ['countedInventoryItems'],
    });
    if (!countToUpdate) {
      throw new Error('count not found');
    }
    const dry_c = await itemRepo.findOne({
      where: { name: DRY_C },
      relations: ['sizes'],
    });
    if (!dry_c) {
      throw new Error('item not found');
    }
    if (!dry_c.sizes) {
      throw new Error('item sizes not found');
    }
    const dto: UpdateInventoryAreaCountDto = {
      countedInventoryItems: [
        {
          id: countToUpdate.countedInventoryItems[0].id,
          countedItemSizeId: dry_c.sizes[0].id,
        },
      ],
    };
    const errors = await validator.validateUpdateNode(dto, countToUpdate.id);
    expectValidationMessage(
      errors,
      [
        {
          prop: 'countedInventoryItems',
          id: countToUpdate.countedInventoryItems[0].id,
        },
        { prop: 'countedItemSize' },
      ],
      'Invalid size for inventory item',
    );
  });

  it('fail validate update: nestedUpdateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSize and inventoryAreaItem.countedItemSizeId both provided', async () => {
    const countToUpdate = await countRepo.findOne({
      where: { inventoryArea: { name: AREA_A } },
      relations: ['countedInventoryItems'],
    });
    if (!countToUpdate) {
      throw new Error('count not found');
    }
    const invItem = await itemRepo.findOne({
      where: {
        id: countToUpdate.countedInventoryItems[0].id,
      },
      relations: ['sizes'],
    });
    if (!invItem) {
      throw new Error('item not found');
    }
    if (!invItem.sizes) {
      throw new Error('item sizes not found');
    }
    const pkg = await packageRepo.findOne({ where: { name: PACKAGE_PKG } });
    if (!pkg) {
      throw new Error('package not found');
    }
    const uom = await uomRepo.findOne({ where: { name: POUND } });
    if (!uom) {
      throw new Error('uom not found');
    }
    const dto: UpdateInventoryAreaCountDto = {
      countedInventoryItems: [
        {
          id: countToUpdate.countedInventoryItems[0].id,
          countedItemSize: {
            createId: 'c1',
            packageId: pkg.id,
            measureTypeId: uom.id,
            measureAmount: 1,
            cost: 1.99,
          },
          countedItemSizeId: invItem.sizes[0].id,
        },
      ],
    };
    const errors = await validator.validateUpdateNode(dto, countToUpdate.id);
    expectValidationMessage(
      errors,
      [
        {
          prop: 'countedInventoryItems',
          id: countToUpdate.countedInventoryItems[0].id,
        },
        { prop: 'countedItemSize' },
      ],
      'Cannot provide both an existing and new item size',
    );
  });
});
