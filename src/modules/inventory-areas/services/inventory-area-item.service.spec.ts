import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItemSize } from '../../inventory-items/entities/inventory-item-size.entity';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import {
  DRY_A,
  FOOD_A,
  FOOD_B,
  FOOD_C,
} from '../../inventory-items/utils/constants';
import { UpdateInventoryAreaCountDto } from '../dto/inventory-area-count/update-inventory-area-count.dto';
import { CreateInventoryAreaItemDto } from '../dto/inventory-area-item/create-inventory-area-item.dto';
import { NestedCreateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-create-inventory-area-item.dto';
import { NestedUpdateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-update-inventory-area-item.dto';
import { UpdateInventoryAreaItemDto } from '../dto/inventory-area-item/update-inventory-area-item.dto';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryAreaItem } from '../entities/inventory-area-item.entity';
import { InventoryArea } from '../entities/inventory-area.entity';
import { AREA_A } from '../utils/constants';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaItemService } from './inventory-area-item.service';

class TestableInventoryAreaItemService extends InventoryAreaItemService {
  async createEntityForTest(
    dto: CreateInventoryAreaItemDto,
    manager: EntityManager,
  ) {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateInventoryAreaItemDto,
    entity: InventoryAreaItem,
    manager: EntityManager,
  ) {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('Inventory area item service', () => {
  let module: TestingModule;
  let testingUtil: InventoryAreaTestUtil;
  let dbTestContext: DatabaseTestContext;
  let areaItemService: TestableInventoryAreaItemService;
  let dataSource: DataSource;

  let inventoryAreaRepo: Repository<InventoryArea>;
  let inventoryAreaItemRepo: Repository<InventoryAreaItem>;
  let inventoryAreaCountRepo: Repository<InventoryAreaCount>;

  let inventoryItemRepo: Repository<InventoryItem>;
  let inventoryItemSizeRepo: Repository<InventoryItemSize>;

  beforeAll(async () => {
    module = await getInventoryAreasTestingModule({
      areaItemServiceClass: TestableInventoryAreaItemService,
    });

    testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
    dbTestContext = new DatabaseTestContext();
    await testingUtil.initInventoryAreaItemCountTestDatabase(dbTestContext);

    dataSource = module.get(DataSource);

    areaItemService = module.get(
      InventoryAreaItemService,
    ) as TestableInventoryAreaItemService;

    inventoryAreaRepo = module.get(getRepositoryToken(InventoryArea));
    inventoryAreaItemRepo = module.get(getRepositoryToken(InventoryAreaItem));
    inventoryAreaCountRepo = module.get(getRepositoryToken(InventoryAreaCount));
    inventoryItemRepo = module.get(getRepositoryToken(InventoryItem));
    inventoryItemSizeRepo = module.get(getRepositoryToken(InventoryItemSize));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(areaItemService).toBeDefined();
  });

  it('should create an item ', async () => {
    const counts = await countService.findByAreaName(AREA_A, [
      'countedInventoryItems',
    ]);
    if (!counts) {
      throw new NotFoundException();
    }
    if (!counts[0]) throw new Error('area a counts is empty');

    const item = await itemService.findOneByName(FOOD_A, ['sizes']);
    if (!item) {
      throw new NotFoundException();
    }
    if (!item.sizes) {
      throw new Error('item sizes is null');
    }

    /*const dto = {
      parentInventoryCountId: counts[0].id,
      countedInventoryItemId: item.id,
      countedAmount: 1,
      countedItemSizeId: item.itemSizes[0].id,
    } as CreateInventoryAreaItemDto;

    await expect(areaItemService.create(dto)).rejects.toThrow(
      BadRequestException,
    );*/

    const createAreaItemDto = plainToInstance(
      NestedCreateInventoryAreaItemDto,
      {
        createId: 'c1',
        countedInventoryItemId: item.id,
        amount: 1,
        countedItemSizeId: item.sizes[0].id,
      },
    );

    if (!counts[0].countedInventoryItems) {
      throw new Error();
    }
    const theRest = counts[0].countedInventoryItems.map((item) =>
      plainToInstance(NestedUpdateInventoryAreaItemDto, {
        id: item.id,
        countedInventoryItemId: item.countedInventoryItem.id,
        amount: item.amount,
        countedItemSizeId: item.countedItemSize.id,
      }),
    );

    const updateCountDto = {
      countedInventoryItems: [createAreaItemDto, ...theRest],
    } as UpdateInventoryAreaCountDto;

    const updateResult = await countService.update(
      counts[0].id,
      updateCountDto,
    );
    if (!updateResult) {
      throw new Error();
    }
    if (!updateResult.countedInventoryItems) {
      throw new Error();
    }

    const result = updateResult.countedInventoryItems[0];

    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
    expect(result?.parentInventoryCount.id).toEqual(counts[0].id);
    expect(result?.countedInventoryItem.id).toEqual(item.id);
    expect(result?.countedItemSize.id).toEqual(item.sizes[0].id);
    expect(result?.amount).toEqual(1);

    testId = result?.id as number;
    oldAreaCountId = counts[0].id;
  });

  it("should update the inventory count's reference of items", async () => {
    const count = await countService.findOne(oldAreaCountId, [
      'countedInventoryItems',
    ]);
    if (!count) {
      throw new NotFoundException();
    }

    expect(
      count.countedInventoryItems?.findIndex((item) => item.id === testId),
    ).not.toEqual(-1);
  });

  it('should update an item (inventory item and item size)', async () => {
    const newItem = await itemService.findOneByName(FOOD_B, ['sizes']);
    if (!newItem) {
      throw new NotFoundException();
    }
    if (!newItem.sizes) {
      throw new Error('item sizes is empty');
    }

    const dto = {
      countedInventoryItemId: newItem.id,
      countedItemSizeId: newItem.sizes[0].id,
    } as UpdateInventoryAreaItemDto;

    const result = await areaItemService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.countedInventoryItem.id).toEqual(newItem.id);
    expect(result?.countedItemSize.id).toEqual(newItem.sizes[0].id);
  });

  it('should update an item (unit amount)', async () => {
    const dto = {
      amount: 2,
    } as UpdateInventoryAreaItemDto;

    const result = await areaItemService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.amount).toEqual(2);
  });

  it('should fail to update an item (not found)', async () => {
    const dto = {
      amount: 2,
    } as UpdateInventoryAreaItemDto;

    await expect(areaItemService.update(0, dto)).rejects.toThrow(Error);
  });

  it('should get all items', async () => {
    const results = await areaItemService.findAll({ limit: 20 });
    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(15);

    testIds = [results.items[0].id, results.items[1].id, results.items[2].id];
  });

  it('should sort all items by item name', async () => {
    const results = await areaItemService.findAll({
      limit: 20,
      sortBy: 'countedInventoryItem',
    });
    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(15);
  });

  it('should sort all items by amount', async () => {
    const results = await areaItemService.findAll({
      limit: 20,
      sortBy: 'amount',
    });
    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(15);
  });

  it('should get items by list of ids', async () => {
    const results = await areaItemService.findEntitiesById(testIds);
    expect(results).not.toBeNull();
    expect(results.length).toEqual(testIds.length);
  });

  it('should get area items by InventoryItem name', async () => {
    const results = await areaItemService.findByItemName(FOOD_B);
    expect(results).not.toBeNull();
    expect(results.length).toBeGreaterThan(0);
  });

  it('should get one item by id', async () => {
    const result = await areaItemService.findOne(testId);
    expect(result).not.toBeNull();
  });

  it('should fail to get one item by id (not found)', async () => {
    await expect(areaItemService.findOne(0)).rejects.toThrow(NotFoundException);
  });

  it('should remove one item by id', async () => {
    const removal = await areaItemService.remove(testId);
    expect(removal).toBeTruthy();

    await expect(areaItemService.findOne(testId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should remove one item by id (not found)', async () => {
    const removal = await areaItemService.remove(testId);
    expect(removal).toBeFalsy();
  });

  // if an inventory item size is deleted, the referencing inv area item count should be deleted
  it("should delete area items when it's referenced itemSize is deleted", async () => {
    const items = await areaItemService.findByItemName(FOOD_B, [
      'countedItemSize',
    ]);
    if (!items) {
      throw new NotFoundException();
    }

    const item = items[0];

    const removal = await sizeService.remove(item.countedItemSize.id);
    if (!removal) {
      throw new Error('size removal failed');
    }

    await expect(areaItemService.findOne(item.id)).rejects.toThrow(
      NotFoundException,
    );
  });

  it("should delete area items when it's referenced inventoryItem is deleted", async () => {
    const areaItems = await areaItemService.findByItemName(FOOD_C, [
      'countedInventoryItem',
    ]);
    if (!areaItems) {
      throw new NotFoundException();
    }

    const areaItem = areaItems[0];

    const removal = await itemService.remove(areaItem.countedInventoryItem.id);
    if (!removal) {
      throw new Error('inventory item removal failed');
    }

    await expect(areaItemService.findOne(areaItem.id)).rejects.toThrow(
      NotFoundException,
    );
  });

  // if the count is deleted, the inv area item count should be deleted
  it("should delete area items when it's referenced inventoryAreaCount is deleted", async () => {
    const areaItems = await areaItemService.findByItemName(DRY_A, [
      'parentInventoryCount',
    ]);
    if (!areaItems) {
      throw new NotFoundException();
    }
    if (!areaItems[0]) {
      throw new Error('areaItems is empty');
    }

    const areaItem = areaItems[0];

    const removal = await countService.remove(areaItem.parentInventoryCount.id);
    if (!removal) {
      throw new Error('inventory count removal failed');
    }

    await expect(areaItemService.findOne(areaItem.id)).rejects.toThrow(
      NotFoundException,
    );
  });
});
