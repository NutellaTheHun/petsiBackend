import { TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { NestedInventoryItemSizeDto } from '../../inventory-items/dto/inventory-item-size/nested-inventory-item-size.dto';
import { InventoryItemService } from '../../inventory-items/services/inventory-item.service';
import { DRY_A, FOOD_A } from '../../inventory-items/utils/constants';
import { CreateInventoryAreaCountDto } from '../dto/inventory-area-count/create-inventory-area-count.dto';
import { UpdateInventoryAreaCountDto } from '../dto/inventory-area-count/update-inventory-area-count.dto';
import { NestedInventoryAreaItemDto } from '../dto/inventory-area-item/nested-inventory-area-item.dto';
import { InventoryAreaCountService } from '../services/inventory-area-count.service';
import { InventoryAreaService } from '../services/inventory-area.service';
import { AREA_A } from '../utils/constants';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaCountValidator } from './inventory-area-count.validator';

describe('inventory area count validator', () => {
  let testingUtil: InventoryAreaTestUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: InventoryAreaCountValidator;
  let countService: InventoryAreaCountService;
  let areaService: InventoryAreaService;
  let itemService: InventoryItemService;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryAreasTestingModule();
    validator = module.get<InventoryAreaCountValidator>(
      InventoryAreaCountValidator,
    );
    countService = module.get<InventoryAreaCountService>(
      InventoryAreaCountService,
    );
    areaService = module.get<InventoryAreaService>(InventoryAreaService);
    itemService = module.get<InventoryItemService>(InventoryItemService);

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
    await testingUtil.initInventoryAreaItemCountTestDatabase(dbTestContext);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  it('should validate create', async () => {
    const area = await areaService.findOneByName(AREA_A);
    if (!area) {
      throw new Error();
    }

    const itemA = await itemService.findOneByName(FOOD_A);
    if (!itemA) {
      throw new Error();
    }

    const itemB = await itemService.findOneByName(DRY_A);
    if (!itemB) {
      throw new Error();
    }

    const itemDtos = [
      plainToInstance(NestedInventoryAreaItemDto, {
        createId: 'c1',
        createDto: {
          countedInventoryItemId: itemA.id,
          countedAmount: 1,
          countedItemSizeId: 0, // **
        },
      }),
      plainToInstance(NestedInventoryAreaItemDto, {
        createId: 'c2',
        createDto: {
          countedInventoryItemId: itemB.id,
          countedAmount: 1,
          countedItemSizeDto: plainToInstance(NestedInventoryItemSizeDto, {
            createId: 'c3',
            measureUnitId: 0, // **
            measureAmount: 1,
            inventoryPackageId: 0, // **
            cost: 2.99,
          }),
        },
      }),
    ];

    const dto = {
      inventoryAreaId: area.id,
      itemCountDtos: itemDtos,
    } as CreateInventoryAreaCountDto;

    await validator.validateCreateNode('root', dto);
  });

  it('create validation: should throw validation error, (validating inventoryAreaItemDtos)', async () => {});

  it('should validate update', async () => {
    const toUpdate = (
      await countService.findAll({ relations: ['countedItems'] })
    ).items[0];
    if (!toUpdate) {
      throw new Error();
    }

    const itemA = await itemService.findOneByName(FOOD_A);
    if (!itemA) {
      throw new Error();
    }

    const itemB = await itemService.findOneByName(DRY_A);
    if (!itemB) {
      throw new Error();
    }

    const itemDtos = [
      plainToInstance(NestedInventoryAreaItemDto, {
        mode: 'create',
        createDto: {
          countedInventoryItemId: itemA.id,
          countedAmount: 1,
        },
      }),
      plainToInstance(NestedInventoryAreaItemDto, {
        mode: 'update',
        id: toUpdate.countedItems[0].id,
        updateDto: {
          countedInventoryItemId: itemB.id,
          countedAmount: 1,
        },
      }),
    ];

    const dto = {
      itemCountDtos: itemDtos,
    } as UpdateInventoryAreaCountDto;

    await validator.validateUpdateNode('root', dto, toUpdate.id);
  });

  it('update validation: should throw validation error, (validating inventoryAreaItemDtos)', async () => {});
});
