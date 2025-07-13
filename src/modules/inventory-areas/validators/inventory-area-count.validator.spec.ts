import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { DUPLICATE } from '../../../util/exceptions/error_constants';
import { ValidationException } from '../../../util/exceptions/validation-exception';
import { InventoryItemService } from '../../inventory-items/services/inventory-item.service';
import { DRY_A, FOOD_A } from '../../inventory-items/utils/constants';
import { CreateInventoryAreaCountDto } from '../dto/inventory-area-count/create-inventory-area-count.dto';
import { UpdateInventoryAreaCountDto } from '../dto/inventory-area-count/update-inventory-area-count.dto';
import { CreateInventoryAreaItemDto } from '../dto/inventory-area-item/create-inventory-area-item.dto';
import { UpdateInventoryAreaItemDto } from '../dto/inventory-area-item/update-inventory-area-item.dto';
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
      {
        countedInventoryItemId: itemA.id,
        countedAmount: 1,
      } as CreateInventoryAreaItemDto,
      {
        countedInventoryItemId: itemB.id,
        countedAmount: 1,
      } as CreateInventoryAreaItemDto,
    ] as CreateInventoryAreaItemDto[];

    const dto = {
      inventoryAreaId: area.id,
      itemCountDtos: itemDtos,
    } as CreateInventoryAreaCountDto;

    await validator.validateCreate(dto);
  });

  it('should pass update', async () => {
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
      {
        countedInventoryItemId: itemA.id,
        countedAmount: 1,
      } as CreateInventoryAreaItemDto,
      {
        id: toUpdate.countedItems[0].id,
        countedInventoryItemId: itemB.id,
        countedAmount: 1,
      } as UpdateInventoryAreaItemDto,
    ] as (CreateInventoryAreaItemDto | UpdateInventoryAreaItemDto)[];

    const dto = {
      itemCountDtos: itemDtos,
    } as UpdateInventoryAreaCountDto;

    await validator.validateUpdate(toUpdate.id, dto);
  });

  it('should fail update: duplicate update ids', async () => {
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
      {
        countedInventoryItemId: itemA.id,
        countedAmount: 1,
      } as CreateInventoryAreaItemDto,
      {
        id: toUpdate.countedItems[0].id,
        countedInventoryItemId: itemB.id,
        countedAmount: 1,
      } as UpdateInventoryAreaItemDto,
      {
        id: toUpdate.countedItems[0].id,
        countedInventoryItemId: itemA.id,
        countedAmount: 1,
      } as UpdateInventoryAreaItemDto,
    ] as (CreateInventoryAreaItemDto | UpdateInventoryAreaItemDto)[];

    const dto = {
      itemCountDtos: itemDtos,
    } as UpdateInventoryAreaCountDto;

    try {
      await validator.validateUpdate(toUpdate.id, dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(DUPLICATE);
    }
  });
});
