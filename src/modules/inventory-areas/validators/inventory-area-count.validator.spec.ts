import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItemPackage } from '../../inventory-items/entities/inventory-item-package.entity';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import {
  FOOD_A,
  FOOD_B,
  PACKAGE_PKG,
} from '../../inventory-items/utils/constants';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { POUND } from '../../unit-of-measure/utils/constants';
import { CreateInventoryAreaCountDto } from '../dto/inventory-area-count/create-inventory-area-count.dto';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryArea } from '../entities/inventory-area.entity';
import { AREA_A } from '../utils/constants';
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
    expect(errors?.['countedInventoryItems']?.[0]?.message).toBe(
      'Inventory count has no counted items',
    ); // MAKE HELPER FOR THIS
  });

  it('fail validate create: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.amount with value 0', async () => {});

  it('fail validate create: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSizeId with invalid countedInventoryItemId', async () => {});

  it('fail validate create: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSize and inventoryAreaItem.countedItemSizeId both provided', async () => {});

  it('fail validate create: nestedCreateInventoryAreaItemDto errors: neither inventoryAreaItem.countedItemSize and inventoryAreaItem.countedItemSizeId not provided', async () => {});

  it('fail validate create: nestedCreateInventoryAreaItemDto errors: nestedCreateInventoryItemSizeDto errors: measureAmount with value 0', async () => {});

  it('fail validate create: nestedCreateInventoryAreaItemDto errors: nestedCreateInventoryItemSizeDto errors: cost with value 0', async () => {});

  // Update Validation Tests
  it('successfully validate update no validation errors', async () => {});

  it('fail validate update: no counted inventory items', async () => {});

  it('fail validate update: nestedCreateInventoryAreaItemDto and nestedUpdateInventoryAreaItemDto errors', async () => {});

  it('fail validate update: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.amount with value 0', async () => {});

  it('fail validate update: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSizeId with invalid countedInventoryItemId', async () => {});

  it('fail validate update: nestedCreateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSize and inventoryAreaItem.countedItemSizeId both provided', async () => {});

  it('fail validate update: nestedCreateInventoryAreaItemDto errors: nestedCreateInventoryItemSizeDto errors: measureAmount with value 0', async () => {});

  it('fail validate update: nestedCreateInventoryAreaItemDto errors: nestedCreateInventoryItemSizeDto errors: cost with value 0', async () => {});

  it('fail validate update: nestedUpdateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSizeId with invalid countedInventoryItemId', async () => {});

  it('fail validate update: nestedUpdateInventoryAreaItemDto errors: inventoryAreaItem.countedItemSize and inventoryAreaItem.countedItemSizeId both provided', async () => {});
});
