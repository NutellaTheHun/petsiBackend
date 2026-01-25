import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Between, DataSource, EntityManager, Like, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { NestedCreateInventoryItemSizeDto } from '../../inventory-items/dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { InventoryItemPackage } from '../../inventory-items/entities/inventory-item-package.entity';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import {
  BOX_PKG,
  DRY_B,
  DRY_C,
  FOOD_B,
  FOOD_C,
} from '../../inventory-items/utils/constants';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { POUND } from '../../unit-of-measure/utils/constants';
import { CreateInventoryAreaCountDto } from '../dto/inventory-area-count/create-inventory-area-count.dto';
import { UpdateInventoryAreaCountDto } from '../dto/inventory-area-count/update-inventory-area-count.dto';
import { NestedCreateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-create-inventory-area-item.dto';
import { NestedUpdateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-update-inventory-area-item.dto';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryArea } from '../entities/inventory-area.entity';
import { AREA_A, AREA_B, AREA_C, AREA_D } from '../utils/constants';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaCountService } from './inventory-area-count.service';

class TestableInventoryAreaCountService extends InventoryAreaCountService {
  async createEntityForTest(
    dto: CreateInventoryAreaCountDto,
    manager: EntityManager,
  ) {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateInventoryAreaCountDto,
    entity: InventoryAreaCount,
    manager: EntityManager,
  ) {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('Inventory area count service', () => {
  let testingUtil: InventoryAreaTestUtil;
  let dbTestContext: DatabaseTestContext;
  let countService: TestableInventoryAreaCountService;
  let dataSource: DataSource;

  let inventoryAreaRepo: Repository<InventoryArea>;
  let inventoryAreaCountRepo: Repository<InventoryAreaCount>;

  let inventoryItemRepo: Repository<InventoryItem>;
  let inventoryItemPackageRepo: Repository<InventoryItemPackage>;

  let unitOfMeasureRepo: Repository<UnitOfMeasure>;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryAreasTestingModule({
      countServiceClass: TestableInventoryAreaCountService,
    });

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
    await testingUtil.initInventoryAreaItemCountTestDatabase(dbTestContext);

    dataSource = module.get(DataSource);

    countService = module.get(
      InventoryAreaCountService,
    ) as TestableInventoryAreaCountService;
    inventoryAreaRepo = module.get(getRepositoryToken(InventoryArea));
    inventoryAreaCountRepo = module.get(getRepositoryToken(InventoryAreaCount));

    inventoryItemRepo = module.get(getRepositoryToken(InventoryItem));
    inventoryItemPackageRepo = module.get(
      getRepositoryToken(InventoryItemPackage),
    );
    unitOfMeasureRepo = module.get(getRepositoryToken(UnitOfMeasure));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(countService).toBeDefined();
  });

  // Test createEntity() with no areaCountItems
  it('should create area count with no items', async () => {
    // get InventoryArea
    const area = await inventoryAreaRepo.findOne({ where: { name: AREA_A } });
    if (!area) {
      throw new Error('area not found');
    }

    // build CreateInventoryAreaCountDto
    const dto = { inventoryAreaId: area.id } as CreateInventoryAreaCountDto;

    // create
    await dataSource.transaction(async (manager) => {
      const result = await countService.createEntityForTest(dto, manager);

      expect(result).not.toBeNull();
      expect(result?.id).not.toBeNull();
      expect(result.inventoryArea.id).toEqual(area.id);
      expect(result.countedInventoryItems.length).toEqual(0);
    });
  });

  // Test createEntity() with areaCountItems with itemSizeIDs
  it('should create area count with items with itemSizeIDs', async () => {
    // get InventoryArea
    const area = await inventoryAreaRepo.findOne({ where: { name: AREA_B } });
    if (!area) {
      throw new Error('area not found');
    }

    // get 3 inventoryItems with sizes from repo
    const items = await inventoryItemRepo.find({
      take: 3,
      relations: ['sizes'],
    });
    if (!items) {
      throw new Error('items not found');
    }
    if (items.length !== 3) {
      throw new Error('expected 3 items, got ' + items.length);
    }

    // build NestedCreateInventoryAreaItemDto for each item
    let count = 1;
    const itemDtos = items.map((item) => {
      return plainToInstance(NestedCreateInventoryAreaItemDto, {
        createId: `c${count++}`,
        countedInventoryItemId: item.id,
        countedItemSizeId: item.sizes[0].id,
        amount: 1,
      });
    });

    const dto = {
      inventoryAreaId: area.id,
      countedInventoryItems: itemDtos,
    } as CreateInventoryAreaCountDto;

    // create
    await dataSource.transaction(async (manager) => {
      const result = await countService.createEntityForTest(dto, manager);
      expect(result).not.toBeNull();
      expect(result?.id).not.toBeNull();
      expect(result.inventoryArea.id).toEqual(area.id);
      expect(result.countedInventoryItems.length).toEqual(3);
    });
  });

  // Test createEntity() with areaCountItems with itemSizeDto
  it('should create area count with items with itemSizeDtos', async () => {
    // get InventoryArea
    const area = await inventoryAreaRepo.findOne({ where: { name: AREA_C } });
    if (!area) {
      throw new Error('area not found');
    }

    // get 3 inventoryItems from repo
    const items = await inventoryItemRepo.find({
      take: 3,
    });
    if (!items) {
      throw new Error('items not found');
    }
    if (items.length !== 3) {
      throw new Error('expected 3 items, got ' + items.length);
    }

    // get 3 unitOfMeasure from repo
    const unitOfMeasures = await unitOfMeasureRepo.find({
      take: 3,
    });
    if (!unitOfMeasures) {
      throw new Error('unitOfMeasures not found');
    }
    if (unitOfMeasures.length !== 3) {
      throw new Error(
        'expected 3 unitOfMeasures, got ' + unitOfMeasures.length,
      );
    }

    // get 3 inventoryItemPackages from repo
    const inventoryItemPackages = await inventoryItemPackageRepo.find({
      take: 3,
    });
    if (!inventoryItemPackages) {
      throw new Error('inventoryItemPackages not found');
    }
    if (inventoryItemPackages.length !== 3) {
      throw new Error(
        'expected 3 inventoryItemPackages, got ' + inventoryItemPackages.length,
      );
    }

    // build NestedCreateInventoryAreaItemDto for each item
    let itemCountId = 1;
    let sizeIdx = 0;
    const itemDtos = items.map((item) => {
      return plainToInstance(NestedCreateInventoryAreaItemDto, {
        createId: `c${itemCountId++}`,
        countedInventoryItemId: item.id,
        amount: 1,
        countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
          createId: `c${4 + sizeIdx}`,
          measureTypeId: unitOfMeasures[sizeIdx].id,
          measureAmount: 1,
          packageId: inventoryItemPackages[sizeIdx++].id,
          cost: 1,
        }),
      });
    });

    // build CreateInventoryAreaCountDto
    const dto = {
      inventoryAreaId: area.id,
      countedInventoryItems: itemDtos,
    } as CreateInventoryAreaCountDto;

    await dataSource.transaction(async (manager) => {
      const result = await countService.createEntityForTest(dto, manager);
      expect(result).not.toBeNull();
      expect(result?.id).not.toBeNull();
      expect(result.inventoryArea.id).toEqual(area.id);
      expect(result.countedInventoryItems.length).toEqual(3);
    });
  });

  // Test createEntity() with areaCountItems with itemSizeId and itemSizeDto
  it('should create area count with items with itemSizeId and itemSizeDto', async () => {
    // get InventoryArea
    const area = await inventoryAreaRepo.findOne({ where: { name: AREA_D } });
    if (!area) {
      throw new Error('area not found');
    }

    // get 6 inventoryItems with sizes from repo
    const items = await inventoryItemRepo.find({
      take: 6,
      relations: ['sizes'],
    });
    if (!items) {
      throw new Error('items not found');
    }
    if (items.length !== 6) {
      throw new Error('expected 6 items, got ' + items.length);
    }

    // build NestedCreateInventoryAreaItemDto with itemSizeId for the first 3 items
    let itemCountId = 1;
    const itemDtos_1 = items.slice(0, 3).map((item) => {
      return plainToInstance(NestedCreateInventoryAreaItemDto, {
        createId: `c${itemCountId++}`,
        countedInventoryItemId: item.id,
        countedItemSizeId: item.sizes[0].id,
      });
    });

    // build NestedCreateInventoryAreaItemDto with itemSizeDto for the last 3 items
    // get 3 unitOfMeasure from repo
    const unitOfMeasures = await unitOfMeasureRepo.find({
      take: 3,
    });
    if (!unitOfMeasures) {
      throw new Error('unitOfMeasures not found');
    }
    if (unitOfMeasures.length !== 3) {
      throw new Error(
        'expected 3 unitOfMeasures, got ' + unitOfMeasures.length,
      );
    }

    // get 3 inventoryItemPackages from repo
    const inventoryItemPackages = await inventoryItemPackageRepo.find({
      take: 3,
    });
    if (!inventoryItemPackages) {
      throw new Error('inventoryItemPackages not found');
    }
    if (inventoryItemPackages.length !== 3) {
      throw new Error(
        'expected 3 inventoryItemPackages, got ' + inventoryItemPackages.length,
      );
    }

    let sizeIdx = 0;
    const itemDtos_2 = items.slice(3, 6).map((item) => {
      return plainToInstance(NestedCreateInventoryAreaItemDto, {
        createId: `c${itemCountId++}`,
        countedInventoryItemId: item.id,
        countedItemSize: plainToInstance(NestedCreateInventoryItemSizeDto, {
          createId: `c${7 + sizeIdx}`,
          measureTypeId: unitOfMeasures[sizeIdx].id,
          measureAmount: 1,
          packageId: inventoryItemPackages[sizeIdx++].id,
          cost: 1,
        }),
      });
    });

    // build CreateInventoryAreaCountDto
    const dto = {
      inventoryAreaId: area.id,
      countedInventoryItems: [...itemDtos_1, ...itemDtos_2],
    } as CreateInventoryAreaCountDto;

    // create
    await dataSource.transaction(async (manager) => {
      const result = await countService.createEntityForTest(dto, manager);
      expect(result).not.toBeNull();
      expect(result?.id).not.toBeNull();
      expect(result.inventoryArea.id).toEqual(area.id);
      expect(result.countedInventoryItems.length).toEqual(6);
    });
  });

  // Test updateEntity() with inventoryAreaId
  it('should update area count with inventoryAreaId from area A to area B', async () => {
    // get InventoryAreaCount to update
    const count = await inventoryAreaCountRepo.findOne({
      where: { inventoryArea: { name: AREA_A } },
    });
    if (!count) {
      throw new Error('count not found');
    }

    // get InventoryArea
    const newArea = await inventoryAreaRepo.findOne({
      where: { name: AREA_B },
    });
    if (!newArea) {
      throw new Error('area not found');
    }

    // build UpdateInventoryAreaCountDto
    const dto = {
      inventoryAreaId: newArea.id,
    } as UpdateInventoryAreaCountDto;

    // update
    await dataSource.transaction(async (manager) => {
      await countService.updateEntityForTest(dto, count, manager);
    });

    // check result
    const result = await inventoryAreaCountRepo.findOne({
      where: { id: count.id },
      relations: ['inventoryArea'],
    });
    if (!result) {
      throw new Error('result not found');
    }
    expect(result.inventoryArea.id).toEqual(newArea.id);
    expect(result.inventoryArea.name).toEqual(newArea.name);
  });

  // Test updateEntity() with update areaCountItems
  it('should update area count with updated items', async () => {
    // get InventoryAreaCount that has inventoryAreaItems to update
    const counts = await inventoryAreaCountRepo.find({
      where: { inventoryArea: { name: AREA_B } },
      relations: ['countedInventoryItems'],
    });
    if (!counts) {
      throw new Error('count not found');
    }

    const countToUpdate = counts.find(
      (count) => count.countedInventoryItems.length > 0,
    );
    if (!countToUpdate) {
      throw new Error('count not found');
    }

    // To test against
    const areaCountItemLength = countToUpdate.countedInventoryItems.length;

    // get InventoryItem with sizes to update
    const itemToUpdate = await inventoryItemRepo.findOne({
      where: { name: FOOD_B },
      relations: ['sizes'],
    });
    if (!itemToUpdate) {
      throw new Error('item not found');
    }

    // build nestedUpdateInventoryAreaCountDto
    const areaItemToUpdateId = countToUpdate.countedInventoryItems[0].id;
    const areaItemToUpdateDto = plainToInstance(
      NestedUpdateInventoryAreaItemDto,
      {
        id: areaItemToUpdateId,
        countedInventoryItemId: itemToUpdate.id,
        countedItemSizeId: itemToUpdate.sizes[0].id,
        amount: 2,
      },
    );

    // build UpdateInventoryAreaCountDto
    const dto = {
      countedInventoryItems: [areaItemToUpdateDto],
    } as UpdateInventoryAreaCountDto;

    // update
    await dataSource.transaction(async (manager) => {
      await countService.updateEntityForTest(dto, countToUpdate, manager);
    });

    // check result
    const result = await inventoryAreaCountRepo.findOne({
      where: { id: countToUpdate.id },
      relations: [
        'countedInventoryItems',
        'countedInventoryItems.countedInventoryItem',
        'countedInventoryItems.countedItemSize',
      ],
    });
    if (!result) {
      throw new Error('result not found');
    }
    expect(result.countedInventoryItems.length).toEqual(areaCountItemLength);
    // check updated item
    const updatedItem = result.countedInventoryItems.find(
      (item) => item.id === areaItemToUpdateId,
    );
    if (!updatedItem) {
      throw new Error('updated item not found');
    }
    expect(updatedItem.countedInventoryItem.id).toEqual(itemToUpdate.id);
    expect(updatedItem.countedItemSize.id).toEqual(itemToUpdate.sizes[0].id);
    expect(updatedItem.amount).toEqual(2);
  });

  // Test updateEntity() with create areaCountItems
  it('should update area count with created items', async () => {
    // get InventoryAreaCount to update
    const countToUpdate = await inventoryAreaCountRepo.findOne({
      where: { inventoryArea: { name: AREA_C } },
      relations: ['countedInventoryItems'],
    });
    if (!countToUpdate) {
      throw new Error('count not found');
    }

    const originalItemCount = countToUpdate.countedInventoryItems.length;

    // get InventoryItem with sizes to create
    const itemToCreate = await inventoryItemRepo.findOne({
      where: { name: FOOD_C },
      relations: ['sizes'],
    });
    if (!itemToCreate) {
      throw new Error('item not found');
    }

    // build NestedCreateInventoryAreaItemDto for the item
    const itemDto = plainToInstance(NestedCreateInventoryAreaItemDto, {
      createId: `c1`,
      countedInventoryItemId: itemToCreate.id,
      countedItemSizeId: itemToCreate.sizes[0].id,
      amount: 10,
    });

    // build UpdateInventoryAreaCountDto
    const dto = {
      countedInventoryItems: [itemDto],
    } as UpdateInventoryAreaCountDto;

    // update
    await dataSource.transaction(async (manager) => {
      await countService.updateEntityForTest(dto, countToUpdate, manager);
    });

    // check result
    const result = await inventoryAreaCountRepo.findOne({
      where: { id: countToUpdate.id },
      relations: ['countedInventoryItems'],
    });
    if (!result) {
      throw new Error('result not found');
    }
    expect(result.countedInventoryItems.length).toEqual(originalItemCount + 1);
    // check created item
    const createdItem = result.countedInventoryItems.find(
      (item) => item.countedInventoryItem.id === itemToCreate.id,
    );
    if (!createdItem) {
      throw new Error('created item not found');
    }
    expect(createdItem.countedInventoryItem.id).toEqual(itemToCreate.id);
    expect(createdItem.countedItemSize.id).toEqual(itemToCreate.sizes[0].id);
    expect(createdItem.amount).toEqual(10);
  });

  // Test updateEntity() with create and update areaCountItems
  it('should update area count with created and updated items with itemSizeDtos', async () => {
    // get InventoryAreaCount to update
    const countToUpdate = await inventoryAreaCountRepo.findOne({
      where: { inventoryArea: { name: AREA_D } },
      relations: ['countedInventoryItems'],
    });
    if (!countToUpdate) {
      throw new Error('count not found');
    }

    const originalItemCount = countToUpdate.countedInventoryItems.length;

    // get InventoryItem for createDto
    const inventoryItemForCreate = await inventoryItemRepo.findOne({
      where: { name: DRY_B },
    });
    if (!inventoryItemForCreate) {
      throw new Error('item not found');
    }

    // get InventoryItem for updateDto
    const inventoryItemForUpdate = await inventoryItemRepo.findOne({
      where: { name: DRY_C },
    });
    if (!inventoryItemForUpdate) {
      throw new Error('item not found');
    }

    // get package from repo
    const packageToCreate = await inventoryItemPackageRepo.findOne({
      where: { name: BOX_PKG },
    });
    if (!packageToCreate) {
      throw new Error('package not found');
    }

    // get unitOfMeasure from repo
    const unitOfMeasureToCreate = await unitOfMeasureRepo.findOne({
      where: { name: POUND },
    });
    if (!unitOfMeasureToCreate) {
      throw new Error('unitOfMeasure not found');
    }

    // build NestedCreateInventoryItemSizeDto for the item
    const itemSizeDto_forCreate = plainToInstance(
      NestedCreateInventoryItemSizeDto,
      {
        createId: `c1`,
        packageId: packageToCreate.id,
        measureTypeId: unitOfMeasureToCreate.id,
        measureAmount: 1,
        cost: 1,
      },
    );

    // build NestedCreateInventoryAreaItemDto for the item
    const createdItemDto = plainToInstance(NestedCreateInventoryAreaItemDto, {
      createId: `c2`,
      countedInventoryItemId: inventoryItemForCreate.id,
      countedItemSize: itemSizeDto_forCreate,
      amount: 20,
    });

    // get areaItem to update
    const areaItemIdToUpdate = countToUpdate.countedInventoryItems[0].id;

    // build NestedCreateInventoryItemSizeDto for the item
    const itemSizeDto_forUpdate = plainToInstance(
      NestedCreateInventoryItemSizeDto,
      {
        createId: `c3`,
        packageId: packageToCreate.id,
        measureTypeId: unitOfMeasureToCreate.id,
        measureAmount: 1,
        cost: 1,
      },
    );

    // build NestedUpdateInventoryAreaItemDto for the item
    const areaItemToUpdateDto = plainToInstance(
      NestedUpdateInventoryAreaItemDto,
      {
        id: areaItemIdToUpdate,
        countedInventoryItemId: inventoryItemForUpdate.id,
        countedItemSize: itemSizeDto_forUpdate,
        amount: 30,
      },
    );

    // build UpdateInventoryAreaCountDto
    const dto = {
      countedInventoryItems: [createdItemDto, areaItemToUpdateDto],
    } as UpdateInventoryAreaCountDto;

    // update
    await dataSource.transaction(async (manager) => {
      await countService.updateEntityForTest(dto, countToUpdate, manager);
    });

    // check result
    const result = await inventoryAreaCountRepo.findOne({
      where: { id: countToUpdate.id },
      relations: [
        'countedInventoryItems',
        'countedInventoryItems.countedInventoryItem',
        'countedInventoryItems.countedItemSize',
        'countedInventoryItems.countedItemSize.measureType',
        'countedInventoryItems.countedItemSize.package',
      ],
    });
    if (!result) {
      throw new Error('result not found');
    }
    expect(result.countedInventoryItems.length).toEqual(originalItemCount + 1);
    // check created item
    const createdAreaItem = result.countedInventoryItems.find(
      (item) => item.countedInventoryItem.id === inventoryItemForCreate.id,
    );
    if (!createdAreaItem) {
      throw new Error('created item not found');
    }
    expect(createdAreaItem.countedInventoryItem.id).toEqual(
      inventoryItemForCreate.id,
    );
    expect(createdAreaItem.countedItemSize.measureType.id).toEqual(
      itemSizeDto_forCreate.measureTypeId,
    );
    expect(createdAreaItem.countedItemSize.package.id).toEqual(
      itemSizeDto_forCreate.packageId,
    );
    expect(createdAreaItem.countedItemSize.measureAmount).toEqual(
      itemSizeDto_forCreate.measureAmount,
    );
    expect(createdAreaItem.countedItemSize.cost).toEqual(
      itemSizeDto_forCreate.cost,
    );
    expect(createdAreaItem.amount).toEqual(20);
    // check updated item
    const updatedAreaItem = result.countedInventoryItems.find(
      (item) => item.id === areaItemIdToUpdate,
    );
    if (!updatedAreaItem) {
      throw new Error('updated item not found');
    }
    expect(updatedAreaItem.countedInventoryItem.id).toEqual(
      inventoryItemForUpdate.id,
    );
    expect(updatedAreaItem.countedItemSize.measureType.id).toEqual(
      itemSizeDto_forUpdate.measureTypeId,
    );
    expect(updatedAreaItem.countedItemSize.package.id).toEqual(
      itemSizeDto_forUpdate.packageId,
    );
    expect(updatedAreaItem.countedItemSize.measureAmount).toEqual(
      itemSizeDto_forUpdate.measureAmount,
    );
    expect(updatedAreaItem.countedItemSize.cost).toEqual(
      itemSizeDto_forUpdate.cost,
    );
    expect(updatedAreaItem.amount).toEqual(30);
  });

  // Test ServceBase Methods:
  it('should find all area counts', async () => {
    const repoResult = await inventoryAreaCountRepo.find();

    const serviceResult = await countService.findAll();
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
  });

  it('should find all area counts with search', async () => {
    // repo result for areaCounts with areaItemCount with countedInventoryItem with name containing 'DRY'
    const repoResult = await inventoryAreaCountRepo.find({
      where: {
        countedInventoryItems: {
          countedInventoryItem: { name: Like('%DRY%') },
        },
      },
    });
    const serviceResult = await countService.findAll({ search: 'DRY' });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
  });

  it('should find all area counts with filter', async () => {
    // get InventoryArea with name AREA_B
    const areaB = await inventoryAreaRepo.findOne({ where: { name: AREA_B } });
    if (!areaB) {
      throw new Error('area not found');
    }

    // repo result for areaCounts with inventoryArea with name containing 'AREA_B'
    const repoResult = await inventoryAreaCountRepo.find({
      where: { inventoryArea: areaB },
    });

    const serviceResult = await countService.findAll({
      filters: ['inventoryArea', `${areaB.id}`],
    });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
  });

  // TODO: Artificial dates to further test this method
  it('should find all area counts with date', async () => {
    //Todays date
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    // repo result for areaCounts with countDate between 2025-01-01 and 2025-01-31
    const repoResult = await inventoryAreaCountRepo.find({
      where: {
        countDate: Between(startOfMonth, endOfMonth),
      },
    });
    const serviceResult = await countService.findAll({
      startDate: startOfMonth.toISOString(),
      endDate: endOfMonth.toISOString(),
    });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
  });

  it('should find all area counts with sort by countDate', async () => {
    // repo result for areaCounts with countDate sorted by countDate descending
    const repoResult = await inventoryAreaCountRepo.find({
      order: { countDate: 'DESC' },
    });
    const serviceResult = await countService.findAll({
      sortBy: 'countDate',
      sortOrder: 'DESC',
    });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
    expect(serviceResult?.items[0].countDate).toEqual(repoResult[0].countDate);
    expect(serviceResult?.items[repoResult.length - 1].countDate).toEqual(
      repoResult[repoResult.length - 1].countDate,
    );
  });

  it('should find all area counts with sort by inventoryArea', async () => {
    // repo result for areaCounts with inventoryArea sorted by inventoryArea name ascending
    const repoResult = await inventoryAreaCountRepo.find({
      order: { inventoryArea: { name: 'ASC' } },
    });
    const serviceResult = await countService.findAll({
      sortBy: 'inventoryArea',
      sortOrder: 'ASC',
    });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
    expect(serviceResult?.items[0].inventoryArea.name).toEqual(
      repoResult[0].inventoryArea.name,
    );
    expect(
      serviceResult?.items[repoResult.length - 1].inventoryArea.name,
    ).toEqual(repoResult[repoResult.length - 1].inventoryArea.name);
  });
  //    Test findOne() with:
  //        relations
  it('should find one area counts', async () => {
    // get area count from repo
    const areaCount = await inventoryAreaCountRepo.find({
      take: 1,
    });
    if (!areaCount) {
      throw new Error('area count not found');
    }
    const serviceResult = await countService.findOne(areaCount[0].id);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(areaCount[0].id);
  });

  it('should find one area counts with relations', async () => {
    // get area count from repo
    const areaCount = await inventoryAreaCountRepo.find({
      take: 1,
      relations: ['inventoryArea'],
    });
    if (!areaCount) {
      throw new Error('area count not found');
    }

    const serviceResult = await countService.findOne(areaCount[0].id, [
      'inventoryArea',
    ]);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(areaCount[0].id);
    expect(serviceResult?.inventoryArea.id).toEqual(
      areaCount[0].inventoryArea.id,
    );
    expect(serviceResult?.inventoryArea.name).toEqual(
      areaCount[0].inventoryArea.name,
    );
  });

  //    Test remove()
  it('should remove area count', async () => {
    // get area count from repo
    const areaCount = await inventoryAreaCountRepo.find({
      take: 1,
    });
    if (!areaCount) {
      throw new Error('area count not found');
    }
    const deleteRequest = await countService.remove(areaCount[0].id);
    expect(deleteRequest).toBe(true);
    await expect(countService.findOne(areaCount[0].id)).rejects.toThrow(
      NotFoundException,
    );
  });

  // Test create()
  // TODO: To implement
  //it('should create area count', async () => {});

  // Test update()
  // TODO: To implement
  //it('should update area count', async () => {});
});
