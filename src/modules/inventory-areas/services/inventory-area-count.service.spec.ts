import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Between, DataSource, EntityManager, Like, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { NestedCreateInventoryItemSizeDto } from '../../inventory-items/dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { InventoryItemPackage } from '../../inventory-items/entities/inventory-item-package.entity';
import { InventoryItemSize } from '../../inventory-items/entities/inventory-item-size.entity';
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
import { InventoryAreaItem } from '../entities/inventory-area-item.entity';
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
  let inventoryAreaItemRepo: Repository<InventoryAreaItem>;

  let inventoryItemRepo: Repository<InventoryItem>;
  let inventoryItemSizeRepo: Repository<InventoryItemSize>;
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
    inventoryAreaItemRepo = module.get(getRepositoryToken(InventoryAreaItem));
    inventoryItemRepo = module.get(getRepositoryToken(InventoryItem));
    inventoryItemSizeRepo = module.get(getRepositoryToken(InventoryItemSize));
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
  it('should create area count', async () => {});

  // Test update()
  // TODO: To implement
  it('should update area count', async () => {});
  /*
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
  */
});
