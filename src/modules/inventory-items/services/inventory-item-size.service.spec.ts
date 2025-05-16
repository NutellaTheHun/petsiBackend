import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { UnitOfMeasureCategoryService } from '../../unit-of-measure/services/unit-of-measure-category.service';
import { UnitOfMeasureService } from '../../unit-of-measure/services/unit-of-measure.service';
import { GALLON, LITER } from '../../unit-of-measure/utils/constants';
import { CreateInventoryItemSizeDto } from '../dto/create-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../dto/update-inventory-item-size.dto';
import { BOX_PKG, CAN_PKG, DRY_A, FOOD_A, OTHER_A } from '../utils/constants';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemPackageService } from './inventory-item-package.service';
import { InventoryItemSizeService } from './inventory-item-size.service';
import { InventoryItemService } from './inventory-item.service';

describe('Inventory Item Size Service', () => {
  let module: TestingModule;
  let testingUtil: InventoryItemTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let sizeService: InventoryItemSizeService;

  let unitService: UnitOfMeasureService;
  let unitCategoryService: UnitOfMeasureCategoryService;
  let packageService: InventoryItemPackageService;
  let itemService: InventoryItemService;

  let testId: number;
  let testIds: number[];

  let testPkgId: number;
  let testUnitMeasureId: number;
  let testItemId: number;

  beforeAll(async () => {
    module = await getInventoryItemTestingModule();
    dbTestContext = new DatabaseTestContext();

    testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
    await testingUtil.initInventoryItemSizeTestDatabase(dbTestContext);

    sizeService = module.get<InventoryItemSizeService>(InventoryItemSizeService);

    packageService = module.get<InventoryItemPackageService>(InventoryItemPackageService);
    unitCategoryService = module.get<UnitOfMeasureCategoryService>(UnitOfMeasureCategoryService);
    itemService = module.get<InventoryItemService>(InventoryItemService);
    unitService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
  });

  afterAll( async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(sizeService).toBeDefined();
  });
  
  it('should create a inventory item size', async () => {
    const unit = await unitService.findOneByName(LITER);
    if(!unit){ throw new Error('measure unit is null'); }

    const packageType = await packageService.findOneByName(BOX_PKG);
    if(!packageType){ throw new Error('package type is null'); }

    const item = await itemService.findOneByName(FOOD_A);
    if(!item){ throw new Error('inventory item is null'); }

    const sizeDto = { 
      unitOfMeasureId: unit?.id,
      inventoryPackageTypeId: packageType?.id,
      inventoryItemId: item?.id,
      cost: 5,
      measureAmount: 1,
    } as CreateInventoryItemSizeDto;
    const result = await sizeService.create(sizeDto);

    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
    expect(result.cost).toEqual("5");
    expect(result?.measureAmount).toEqual(1);
    testId = result?.id as number;
    testItemId = item.id;
  });

  it('should update inventoryItem query with new size', async () => {
    const item = await itemService.findOne(testItemId, ['sizes']);
    if(!item){ throw new NotFoundException(); }
    if(!item.sizes){ throw new Error("sizes is null"); }

    expect(item.sizes.findIndex(size => size.id === testId)).not.toEqual(-1);
  });

  it('should find item size by id', async () => {
    const result = await sizeService.findOne(testId);
    expect(result).not.toBeNull();
    expect(result?.id).toEqual(testId);
  });

  it('should find item size by item name', async () => {
    const results = await sizeService.findSizesByItemName(FOOD_A);
    expect(results).not.toBeNull();
    expect(results?.findIndex(size => size.id === testId)).not.toEqual(-1);
  });

  it('should update an item (measure amount)', async () => {
      const dto = {
          measureAmount: 2,
      } as UpdateInventoryItemSizeDto;

      const result = await sizeService.update(testId, dto);
      expect(result).not.toBeNull();
      expect(result?.measureAmount).toEqual(2);
  });

  it('should update size unit of measure', async () => {
    const unit = await unitService.findOneByName(GALLON);
    if(!unit){ throw new Error('unit of measure to update with is null'); }

    const dto = {
      unitOfMeasureId: unit.id
    } as UpdateInventoryItemSizeDto;
    const result = await sizeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.measureUnit.id).toEqual(unit.id);

    testUnitMeasureId = unit.id;
  });

  it('should update size package type', async () => {
    const pkg = await packageService.findOneByName(CAN_PKG);
    if(!pkg){ throw new Error('pacakge to update with is null'); }

    const dto = {
      inventoryPackageTypeId: pkg.id
    } as UpdateInventoryItemSizeDto;
    const result = await sizeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.packageType.id).toEqual(pkg.id);

    testPkgId = pkg.id;
  });

  it('should update cost', async () => {
    const dto = {
      cost: 12.47,
    } as UpdateInventoryItemSizeDto;

    const result = await sizeService.update(testId, dto);
    expect(result.cost).toEqual("12.47");
  })

  it('should retain all updated properties', async () => {
    const verify = await sizeService.findOne(testId, ['item', 'measureUnit', 'packageType']);
    if(!verify){ throw new NotFoundException(); }
    expect(verify.item.id).toEqual(testItemId);
    expect(verify.measureUnit.id).toEqual(testUnitMeasureId);
    expect(verify.packageType.id).toEqual(testPkgId);
  });

  it('should insert tesing sizes and get all', async () => {
    const testingSizes = await testingUtil.getTestInventoryItemSizeEntities(dbTestContext);
    const results = await sizeService.findAll({ limit: 25 });

    expect(results).not.toBeNull();
    expect(results.items.length).toBeGreaterThan(0);
    expect(results.items.length).toEqual(testingSizes.length + 1); // including size from create test

    testIds = [results.items[0].id, results.items[1].id, results.items[2].id];
  });

  it('should get a inventory item size by item name', async () => {
    const results = await sizeService.findSizesByItemName(FOOD_A);

    expect(results).not.toBeNull();
    expect(results?.length).toBeGreaterThan(0);
  });

  it('should get inventory item sizes from a list of ids', async () => {
    const results = await sizeService.findEntitiesById(testIds);

    expect(results).not.toBeNull();
    expect(results.length).toEqual(testIds.length);
  });

  // If a package is deleted, the itemSizes are also deleted.
  it('should delete a package and delete the item size', async () => {
    const item = await itemService.findOneByName(DRY_A, ['sizes']);
    if(!item){ throw new NotFoundException(); }
    if(!item.sizes){ throw new Error("item sizes is empty");} 
    
    const size = await sizeService.findOne(item.sizes[0].id, ['packageType']);
    if(!size){ throw new NotFoundException(); }

    const removal = await packageService.remove(size?.packageType.id);
    if(!removal){ throw new Error("unit of measure removal failed"); }

    await expect(sizeService.findOne(item.sizes[0].id)).rejects.toThrow(NotFoundException);
  });

  // If a item is deleted, the itemSizes are also deleted.
  it('should delete a item and delete the item size', async () => {
    const item = await itemService.findOneByName(OTHER_A, ['sizes']);
    if(!item){ throw new NotFoundException(); }
    if(!item.sizes){ throw new Error("item sizes is empty"); }

    const size = await sizeService.findOne(item.sizes[0].id, ['item']);
    if(!size){ throw new NotFoundException(); }

    const removal = await itemService.remove(size?.item.id);
    if(!removal){ throw new Error("unit of measure removal failed"); }

    await expect(sizeService.findOne(item.sizes[0].id)).rejects.toThrow(NotFoundException);
  });

  it('should remove a inventory item size', async () => {
    const removal = await sizeService.remove(testId);
    expect(removal).toBeTruthy();

    await expect(sizeService.findOne(testId)).rejects.toThrow(NotFoundException);
  });

  it('should query inventoryItem with removed size not present', async () => {
    const item = await itemService.findOne(testItemId, ['sizes']);
    if(!item){ throw new NotFoundException(); }
    if(!item.sizes){ throw new Error("sizes is null"); }

    expect(item.sizes.findIndex(size => size.id === testId)).toEqual(-1);
  });
});
