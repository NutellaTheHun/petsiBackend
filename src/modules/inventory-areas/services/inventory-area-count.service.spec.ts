import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { NestedCreateInventoryItemSizeDto } from '../../inventory-items/dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { NestedUpdateInventoryItemSizeDto } from '../../inventory-items/dto/inventory-item-size/nested-update-inventory-item-size.dto';
import { InventoryItemPackageService } from '../../inventory-items/services/inventory-item-package.service';
import { InventoryItemService } from '../../inventory-items/services/inventory-item.service';
import {
  BOX_PKG,
  CAN_PKG,
  DRY_B,
  FOOD_A,
  FOOD_B,
  FOOD_C,
} from '../../inventory-items/utils/constants';
import { UnitOfMeasureService } from '../../unit-of-measure/services/unit-of-measure.service';
import { FL_OUNCE, POUND } from '../../unit-of-measure/utils/constants';
import { CreateInventoryAreaCountDto } from '../dto/inventory-area-count/create-inventory-area-count.dto';
import { UpdateInventoryAreaCountDto } from '../dto/inventory-area-count/update-inventory-area-count.dto';
import { NestedCreateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-create-inventory-area-item.dto';
import { NestedUpdateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-update-inventory-area-item.dto';
import { AREA_A, AREA_B } from '../utils/constants';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaCountService } from './inventory-area-count.service';
import { InventoryAreaItemService } from './inventory-area-item.service';
import { InventoryAreaService } from './inventory-area.service';

describe('Inventory area count service', () => {
  let testingUtil: InventoryAreaTestUtil;
  let dbTestContext: DatabaseTestContext;

  let countService: InventoryAreaCountService;
  let areaService: InventoryAreaService;
  let areaItemService: InventoryAreaItemService;

  let itemService: InventoryItemService;
  let measureService: UnitOfMeasureService;
  let packageService: InventoryItemPackageService;

  let testAreaId: number;
  let testCountId: number;
  let testCountIds: number[];

  let testItemCountIds: number[];
  let updateItemTestId: number;
  let itemSizeTestId: number;
  let deletedAreaItemId: number;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryAreasTestingModule();

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
    await testingUtil.initInventoryAreaItemCountTestDatabase(dbTestContext);

    countService = module.get<InventoryAreaCountService>(
      InventoryAreaCountService,
    );
    areaService = module.get<InventoryAreaService>(InventoryAreaService);
    areaItemService = module.get<InventoryAreaItemService>(
      InventoryAreaItemService,
    );

    itemService = module.get<InventoryItemService>(InventoryItemService);
    measureService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
    packageService = module.get<InventoryItemPackageService>(
      InventoryItemPackageService,
    );
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(countService).toBeDefined();
  });

  it('should create area count with items', async () => {
    const areaA = await areaService.findOneByName(AREA_A);
    if (!areaA) {
      throw new NotFoundException();
    }

    const foodA = await itemService.findOneByName(FOOD_A, ['sizes']);
    if (!foodA) {
      throw new Error();
    }

    const foodB = await itemService.findOneByName(FOOD_B, ['sizes']);
    if (!foodB) {
      throw new Error();
    }

    const unit = await measureService.findOneByName(POUND);
    if (!unit) {
      throw new Error();
    }

    const pkg = await packageService.findOneByName(BOX_PKG);
    if (!pkg) {
      throw new Error();
    }

    const sizeDto = plainToInstance(NestedCreateInventoryItemSizeDto, {
      createId: 'c1',
      packageId: pkg.id,
      measureTypeId: unit.id,
      measureAmount: 1,
      cost: 1,
    });

    const itemDtos = [
      plainToInstance(NestedCreateInventoryAreaItemDto, {
        createId: 'c2',
        countedInventoryItemId: foodA.id,
        amount: 1,
        countedItemSizeId: foodA.sizes[0].id,
      }),
      plainToInstance(NestedCreateInventoryAreaItemDto, {
        createId: 'c3',
        countedInventoryItemId: foodB.id,
        amount: 1,
        countedItemSize: sizeDto,
      }),
    ];

    const dto = {
      inventoryAreaId: areaA.id,
      countedInventoryItems: itemDtos,
    } as CreateInventoryAreaCountDto;

    const result = await countService.create(dto);
    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
    expect(result.countedInventoryItems.length).toEqual(2);

    testAreaId = areaA.id as number;
    testCountId = result?.id as number;
  });

  it("should update inventoryArea's list of areaCounts", async () => {
    const areaA = await areaService.findOneByName(AREA_A, ['inventoryCounts']);
    if (!areaA) {
      throw new Error('inventory area not found');
    }

    expect(areaA?.inventoryCounts).not.toBeUndefined();
    expect(areaA?.inventoryCounts?.length).toEqual(2);
  });

  it('should THROW ERROR, to create area count (bad areaID)', async () => {
    const dto = { inventoryAreaId: 10 } as CreateInventoryAreaCountDto;
    await expect(countService.create(dto)).rejects.toThrow(Error);
  });

  it("should update areaCount's area", async () => {
    const newArea = await areaService.findOneByName(AREA_B);
    if (!newArea) {
      throw new Error('new inventoryArea not found');
    }

    const toUpdate = await countService.findOne(testCountId);
    if (!toUpdate) {
      throw new Error('inventory count to update not found');
    }

    const result = await countService.update(toUpdate.id, {
      inventoryAreaId: newArea.id,
    } as UpdateInventoryAreaCountDto);

    expect(result).not.toBeNull();
    expect(result?.inventoryArea.id).toEqual(newArea.id);
    expect(result?.inventoryArea.name).toEqual(newArea.name);
  });

  it('should remove inventoryCount reference from old inventory Area, and update new one', async () => {
    const oldArea = await areaService.findOneByName(AREA_A, [
      'inventoryCounts',
    ]);
    if (!oldArea) {
      throw new Error('old inventory area not found');
    }
    expect(oldArea?.inventoryCounts?.length).toEqual(1);

    const newArea = await areaService.findOneByName(AREA_B, [
      'inventoryCounts',
    ]);
    if (!newArea) {
      throw new Error('new inventoryArea not found');
    }
    if (!newArea.inventoryCounts) {
      throw new Error('new inventoryAreas inventory counts not found');
    }
    expect(newArea?.inventoryCounts).not.toBeNull();
    expect(newArea?.inventoryCounts?.length).toEqual(2); // Area B has 1 area count by default from test initialization
    expect(
      newArea?.inventoryCounts.findIndex((count) => count.id === testCountId),
    ).not.toEqual(-1);
  });

  it('should fail to update area count (doesnt exist)', async () => {
    const newArea = await areaService.findOneByName(AREA_B);
    if (!newArea) {
      throw new Error('new inventoryArea not found');
    }

    const toUpdate = await countService.findOne(testCountId);
    if (!toUpdate) {
      throw new Error('inventory count to update not found');
    }

    await expect(
      countService.update(0, {
        inventoryAreaId: newArea.id,
      } as UpdateInventoryAreaCountDto),
    ).rejects.toThrow(Error);
  });

  it('should find area counts by area', async () => {
    const results = await countService.findByAreaName(AREA_B);
    expect(results).not.toBeNull();
    expect(results.length).toEqual(2);
  });

  it('should find area counts by date', async () => {
    const results = await countService.findByDate(new Date());
    expect(results).not.toBeNull();
    expect(results.length).toEqual(8); // all test inventory counts (6) plus one created in tests above

    testCountIds = [results[0].id];
  });

  it('should get all area counts', async () => {
    const results = await countService.findAll({
      relations: ['inventoryArea'],
    });
    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(8); // all test inventory counts (6) plus one created in tests above
  });

  it('should sort area counts by area name', async () => {
    const results = await countService.findAll({
      relations: ['inventoryArea'],
      sortBy: 'inventoryArea',
    });
    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(8); // all test inventory counts (6) plus one created in tests above
  });

  it('should sort area counts by countDate', async () => {
    const results = await countService.findAll({
      relations: ['inventoryArea'],
      sortBy: 'countDate',
    });
    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(8); // all test inventory counts (6) plus one created in tests above
  });

  it('should search area counts', async () => {
    const results = await countService.findAll({ search: FOOD_A });
    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(4);
  });

  it('should filter by inventoryArea', async () => {
    const area = await areaService.findOneByName(AREA_A);
    if (!area) {
      throw new Error();
    }

    const results = await countService.findAll({
      filters: [`inventoryArea=${area.id}`],
    });
    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(1);
  });

  it('should filter by date', async () => {
    const date = new Date();
    const today = `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`;

    const results = await countService.findAll({ startDate: today });
    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(8);
  });

  it('should filter by date range', async () => {
    const today = new Date();

    let startYear = today.getFullYear();
    let endYear = today.getFullYear();

    let startMonth = today.getMonth() + 1;
    let endMonth = today.getMonth() + 1;

    let startDate = today.getDate() - 1;
    let endDate = today.getDate() + 1;

    if (today.getDate() === 1) {
      if (startMonth === 1) {
        startMonth = 12;
        startYear--;
      } else {
        startMonth--;
      }
      startDate = 28;
    }
    if (today.getDate() > 28) {
      endDate++;
    }

    const start = `${startMonth}/${startDate}/${startYear}`;
    const end = `${endMonth}/${endDate}/${endYear}`;

    const results = await countService.findAll({
      startDate: start,
      endDate: end,
    });
    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(8);
  });

  it('should get area counts by id', async () => {
    const results = await countService.findEntitiesById(testCountIds);

    expect(results).not.toBeNull();
    expect(results.length).toEqual(testCountIds.length);
    for (const result of results) {
      expect(testCountIds.find((id) => result.id)).toBeTruthy();
    }
  });

  it('should update area count with (created) counted items, with pre-existing sizes and created sizes', async () => {
    const itemsRequest = await itemService.findAll({
      relations: ['sizes'],
    });
    const items = itemsRequest.items;
    if (!items) {
      throw new Error('items is null');
    }

    const packagesRequest = await packageService.findAll();
    const packages = packagesRequest.items;
    if (!packages) {
      throw new Error('packages is null');
    }

    const unitsRequest = await measureService.findAll();
    const units = unitsRequest.items;
    if (!units) {
      throw new Error('units is null');
    }

    if (!items[0].sizes) {
      throw new Error("first item's sizes is null");
    }
    const item_a = {
      itemId: items[0].id,
      itemSizeId: items[0].sizes[0].id,
    };

    if (!items[1].sizes) {
      throw new Error("first item's sizes is null");
    }
    const item_b = {
      itemId: items[1].id,
      itemSizeId: items[1].sizes[0].id,
    };

    const uom = await measureService.findOneByName(POUND);
    if (!uom) {
      throw new NotFoundException();
    }
    const pkg = await packageService.findOneByName(BOX_PKG);
    if (!pkg) {
      throw new NotFoundException();
    }

    const sizeDto = plainToInstance(NestedCreateInventoryItemSizeDto, {
      createId: 'c4',
      packageId: pkg.id,
      measureTypeId: uom.id,
      measureAmount: 1,
      cost: 12,
    });
    const item_c = { itemId: items[2].id, sizeDto };

    const itemCountDtos = testingUtil.createNestedInventoryAreaItemDtos([
      item_a,
      item_b,
      item_c,
    ]);

    const nestedItemCountDtos = itemCountDtos.map((dto) =>
      plainToInstance(NestedCreateInventoryAreaItemDto, dto),
    );

    const updateCountDto = {
      countedInventoryItems: nestedItemCountDtos,
    } as UpdateInventoryAreaCountDto;

    const result = await countService.update(testCountId, updateCountDto);
    expect(result).not.toBeNull();
    expect(result?.countedInventoryItems?.length).toEqual(3);

    testItemCountIds = result?.countedInventoryItems?.map(
      (item) => item.id,
    ) as number[];
  });

  it('should query newly counted items from itemCountService', async () => {
    const results = await areaItemService.findEntitiesById(testItemCountIds, [
      'parentInventoryCount',
      'countedItemSize',
      'countedInventoryItem',
    ]);
    if (!results) {
      throw new Error('results is null');
    }

    for (const item of results) {
      expect(item.parentInventoryCount).not.toBeNull();
      expect(item.countedInventoryItem).not.toBeNull();
      expect(item.countedItemSize).not.toBeNull();
    }
  });

  it("should update an area count item's unit amount", async () => {
    const areaCount = await countService.findOne(
      testCountId,
      ['countedInventoryItems'],
      ['countedInventoryItems.countedItemSize'],
    );
    if (!areaCount) {
      throw new NotFoundException();
    }
    if (!areaCount.countedInventoryItems) {
      throw new Error("area count's items is null");
    }

    updateItemTestId = areaCount.countedInventoryItems[0].id;
    const updateAreaItemDto = plainToInstance(
      NestedUpdateInventoryAreaItemDto,
      {
        id: updateItemTestId,
        amount: 10,
      },
    );

    const theRest = areaCount.countedInventoryItems.splice(1).map((areaItem) =>
      plainToInstance(NestedUpdateInventoryAreaItemDto, {
        id: areaItem.id,
      }),
    );

    const updateAreaCountDto = {
      countedInventoryItems: [updateAreaItemDto, ...theRest],
    } as UpdateInventoryAreaCountDto;

    const result = await countService.update(testCountId, updateAreaCountDto);
    if (!result?.countedInventoryItems) {
      throw new Error('results area items is null');
    }

    expect(result).not.toBeNull();
    expect(result?.countedInventoryItems?.length).toEqual(3);
    for (const item of result?.countedInventoryItems) {
      if (item.id === updateItemTestId) {
        expect(item.amount).toEqual(10);
      }
    }
  });

  it('should update unit amount of queried area item', async () => {
    const result = await areaItemService.findOne(updateItemTestId);
    expect(result).not.toBeNull();
    expect(result?.amount).toEqual(10);
  });

  it("should update an area count item's size unit of measure", async () => {
    const areaCount = await countService.findOne(
      testCountId,
      ['countedInventoryItems'],
      ['countedInventoryItems.countedItemSize'],
    );
    if (!areaCount) {
      throw new NotFoundException();
    }
    if (!areaCount.countedInventoryItems) {
      throw new Error("area count's items is null");
    }

    updateItemTestId = areaCount.countedInventoryItems[0].id;
    itemSizeTestId = areaCount.countedInventoryItems[0].countedItemSize.id;

    const uom = await measureService.findOneByName(FL_OUNCE);
    if (!uom) {
      throw new NotFoundException();
    }
    const itemSizeUpdateDto = plainToInstance(
      NestedUpdateInventoryItemSizeDto,
      {
        id: itemSizeTestId,
        measureTypeId: uom.id,
      },
    );

    const updateAreaItemDto = plainToInstance(
      NestedUpdateInventoryAreaItemDto,
      {
        id: updateItemTestId,
        countedItemSize: itemSizeUpdateDto,
      },
    );

    const theRest = areaCount.countedInventoryItems.splice(1).map((areaItem) =>
      plainToInstance(NestedUpdateInventoryAreaItemDto, {
        id: areaItem.id,
      }),
    );

    const updateAreaCountDto = {
      countedInventoryItems: [updateAreaItemDto, ...theRest],
    } as UpdateInventoryAreaCountDto;

    const result = await countService.update(testCountId, updateAreaCountDto);
    if (!result?.countedInventoryItems) {
      throw new Error('results area items is null');
    }

    expect(result).not.toBeNull();
    expect(result?.countedInventoryItems?.length).toEqual(3);
    for (const item of result?.countedInventoryItems) {
      if (item.id === updateItemTestId) {
        expect(item.countedItemSize.measureType.name).toEqual(FL_OUNCE);
      }
    }
  });

  it("should update an area count item size's package", async () => {
    const areaCount = await countService.findOne(
      testCountId,
      ['countedInventoryItems'],
      ['countedInventoryItems.countedItemSize'],
    );
    if (!areaCount) {
      throw new NotFoundException();
    }
    if (!areaCount.countedInventoryItems) {
      throw new Error("area count's items is null");
    }

    updateItemTestId = areaCount.countedInventoryItems[0].id;
    itemSizeTestId = areaCount.countedInventoryItems[0].countedItemSize.id;

    const pkg = await packageService.findOneByName(CAN_PKG);
    if (!pkg) {
      throw new NotFoundException();
    }
    const itemSizeUpdateDto = plainToInstance(
      NestedUpdateInventoryItemSizeDto,
      {
        id: itemSizeTestId,
        packageId: pkg.id,
      },
    );

    const updateAreaItemDto = plainToInstance(
      NestedUpdateInventoryAreaItemDto,
      {
        id: updateItemTestId,
        countedItemSize: itemSizeUpdateDto,
      },
    );

    const theRest = areaCount.countedInventoryItems.splice(1).map((areaItem) =>
      plainToInstance(NestedUpdateInventoryAreaItemDto, {
        id: areaItem.id,
      }),
    );

    const updateAreaCountDto = {
      countedInventoryItems: [updateAreaItemDto, ...theRest],
    } as UpdateInventoryAreaCountDto;

    const result = await countService.update(testCountId, updateAreaCountDto);
    if (!result?.countedInventoryItems) {
      throw new Error('results area items is null');
    }

    expect(result).not.toBeNull();
    expect(result?.countedInventoryItems?.length).toEqual(3);
    for (const item of result?.countedInventoryItems) {
      if (item.id === updateItemTestId) {
        expect(item.countedItemSize.package.name).toEqual(CAN_PKG);
      }
    }
  });

  it("should update an area count item's inventory item (which means also size)", async () => {
    const areaCount = await countService.findOne(
      testCountId,
      ['countedInventoryItems'],
      ['countedInventoryItems.countedItemSize'],
    );
    if (!areaCount) {
      throw new NotFoundException();
    }
    if (!areaCount.countedInventoryItems) {
      throw new Error("area count's items is null");
    }

    updateItemTestId = areaCount.countedInventoryItems[0].id;
    itemSizeTestId = areaCount.countedInventoryItems[0].countedItemSize.id;

    const item = await itemService.findOneByName(FOOD_C, ['sizes']);
    if (!item) {
      throw new NotFoundException();
    }
    if (!item.sizes) {
      throw new NotFoundException();
    }

    const updateAreaItemDto = plainToInstance(
      NestedUpdateInventoryAreaItemDto,
      {
        id: updateItemTestId,
        countedInventoryItemId: item.id,
        countedItemSizeId: item.sizes[0].id,
      },
    );

    const theRest = areaCount.countedInventoryItems.splice(1).map((areaItem) =>
      plainToInstance(NestedUpdateInventoryAreaItemDto, {
        id: areaItem.id,
      }),
    );

    const updateAreaCountDto = {
      countedInventoryItems: [updateAreaItemDto, ...theRest],
    } as UpdateInventoryAreaCountDto;

    const result = await countService.update(testCountId, updateAreaCountDto);
    if (!result?.countedInventoryItems) {
      throw new Error('results area items is null');
    }

    expect(result).not.toBeNull();
    expect(result?.countedInventoryItems?.length).toEqual(3);
    for (const item of result?.countedInventoryItems) {
      if (item.id === updateItemTestId) {
        expect(item.countedInventoryItem.name).toEqual(FOOD_C);
      }
    }
  });

  it('should reflect new item for item size when queried', async () => {
    const result = await areaItemService.findOne(
      updateItemTestId,
      ['countedItemSize'],
      ['countedItemSize.inventoryItem'],
    );
    expect(result).not.toBeNull();
    expect(result?.countedItemSize.inventoryItem.name).toEqual(FOOD_C);
  });

  it("should update an area count item's with creating a new counted item, modifying another item, and removing another item", async () => {
    const areaCount = await countService.findOne(
      testCountId,
      ['countedInventoryItems'],
      ['countedInventoryItems.countedItemSize'],
    );
    if (!areaCount) {
      throw new NotFoundException();
    }
    if (!areaCount.countedInventoryItems) {
      throw new Error("area count's items is null");
    }

    updateItemTestId = areaCount.countedInventoryItems[0].id;

    const updateAreaItemDto = plainToInstance(
      NestedUpdateInventoryAreaItemDto,
      {
        id: updateItemTestId,
        amount: 50,
      },
    );

    const item = await itemService.findOneByName(DRY_B, ['sizes']);
    if (!item) {
      throw new NotFoundException();
    }
    if (!item.sizes) {
      throw new Error('item sizes is null');
    }
    const createAreaItemDto = plainToInstance(
      NestedCreateInventoryAreaItemDto,
      {
        createId: 'c5',
        amount: 100,
        countedInventoryItemId: item.id,
        countedItemSizeId: item.sizes[0].id,
      },
    );

    const theRest = plainToInstance(NestedUpdateInventoryAreaItemDto, {
      id: areaCount.countedInventoryItems[1].id,
    });

    deletedAreaItemId = areaCount.countedInventoryItems[2].id;

    const updateAreaCountDto = {
      countedInventoryItems: [updateAreaItemDto, createAreaItemDto, theRest],
    } as UpdateInventoryAreaCountDto;

    const result = await countService.update(testCountId, updateAreaCountDto);
    if (!result?.countedInventoryItems) {
      throw new Error('results area items is null');
    }
    expect(result).not.toBeNull();
    expect(result.countedInventoryItems.length).toEqual(3);
    expect(
      result.countedInventoryItems.findIndex(
        (item) => item.id === deletedAreaItemId,
      ),
    ).toEqual(-1);

    testItemCountIds = result.countedInventoryItems.map((i) => i.id);
  });

  it("should update an area count item's to not have removed item", async () => {
    await expect(areaItemService.findOne(deletedAreaItemId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should remove area count', async () => {
    const result = await countService.remove(testCountId);
    expect(result).toBeTruthy();

    await expect(countService.findOne(testCountId)).rejects.toThrow(
      NotFoundException,
    );

    const area = await areaService.findOneByName(AREA_B, ['inventoryCounts']);
    expect(area?.inventoryCounts?.length).toEqual(1);
  });

  it('should remove area count items associated with removed area count', async () => {
    const results = await areaItemService.findEntitiesById(testItemCountIds);
    expect(results.length).toEqual(0);
  });
});
