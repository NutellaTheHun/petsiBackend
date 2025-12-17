import { TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
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
      countedInventoryItemDtos: itemDtos,
    } as CreateInventoryAreaCountDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('create validation fail: should throw inventoryAreaItem validation error, no itemSize', async () => {
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
      // erroneous DTO
      plainToInstance(NestedInventoryAreaItemDto, {
        createId: 'c2',
        createDto: {
          countedInventoryItemId: itemB.id,
          countedAmount: 1,
        },
      }),
    ];

    const dto = {
      inventoryAreaId: area.id,
      countedInventoryItemDtos: itemDtos,
    } as CreateInventoryAreaCountDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.field).toEqual('countedItems');
    expect(result?.children[0].children.length).toEqual(1);
  });

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
        id: toUpdate.countedInventoryItems[0].id,
        updateDto: {
          countedInventoryItemId: itemB.id,
          countedAmount: 1,
        },
      }),
    ];

    const dto = {
      countedInventoryItemDtos: itemDtos,
    } as UpdateInventoryAreaCountDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeNull();
  });

  it('update validation: should fail inventoryAreaItem validation, inventoryItem with no size', async () => {
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
          //needs size assignment
        },
      }),
      // erroneous DTO
      plainToInstance(NestedInventoryAreaItemDto, {
        mode: 'update',
        id: toUpdate.countedInventoryItems[0].id,
        updateDto: {
          countedInventoryItemId: itemB.id,
          countedAmount: 1,
        },
      }),
    ];

    const dto = {
      countedInventoryItemDtos: itemDtos,
    } as UpdateInventoryAreaCountDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.field).toEqual('countedItems');
    expect(result?.children[0].children.length).toEqual(1);
  });
});
