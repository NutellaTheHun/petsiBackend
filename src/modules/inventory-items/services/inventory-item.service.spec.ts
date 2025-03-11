import { TestingModule } from '@nestjs/testing';
import { InventoryItemService } from './inventory-item.service';
import { InventoryItemFactory } from '../factories/inventory-item.factory';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemCategoryService } from './inventory-item-category.service';
import { InventoryItemSizeService } from './inventory-item-size.service';
import { InventoryItemVendorService } from './inventory-item-vendor.service';
import { InventoryItemPackageService } from './inventory-item-package.service';
import { UnitOfMeasureService } from '../../unit-of-measure/services/unit-of-measure.service';
import { cleanupTestingDatabaseLayerZERO, setupTestingDatabaseLayerZERO } from '../utils/setupTestingDatabase';
import { InventoryItemSizeFactory } from '../factories/inventory-item-size.factory';
import { LITER } from '../../unit-of-measure/utils/constants';
import { FOOD_A } from '../utils/constants';

describe('Inventory Item Service', () => {
  let module: TestingModule;
  let itemService: InventoryItemService;
  let itemFactory: InventoryItemFactory;

  let testId: number;
  let testIds: number[];

  let categoryService: InventoryItemCategoryService;
  let packageService: InventoryItemPackageService;
  let sizeService: InventoryItemSizeService;
  let vendorService: InventoryItemVendorService;

  let sizeFactory: InventoryItemSizeFactory;

  let measureService: UnitOfMeasureService;

  beforeAll(async () => {
    //const module: TestingModule = await getInventoryItemTestingModule();
    module = await getInventoryItemTestingModule();

    categoryService = module.get<InventoryItemCategoryService>(InventoryItemCategoryService);
    // await itemCategoryService.initializeTestingDatabase();

    vendorService = module.get<InventoryItemVendorService>(InventoryItemVendorService);
    // await itemVendorService.initializeTestingDatabase();

    packageService = module.get<InventoryItemPackageService>(InventoryItemPackageService);
    // await itemPackageService.initializeTestingDatabase();

    await setupTestingDatabaseLayerZERO(module);

    measureService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
    await measureService.initializeTestingDatabase();

    // not initialized, depends on testing inventory items being populated.
    sizeService = module.get<InventoryItemSizeService>(InventoryItemSizeService);

    itemService = module.get<InventoryItemService>(InventoryItemService);
    itemFactory = module.get<InventoryItemFactory>(InventoryItemFactory);

    sizeFactory = module.get<InventoryItemSizeFactory>(InventoryItemSizeFactory);
  });

  afterAll(async () => {
    /*
    const categoryQuery = itemCategoryService.getQueryBuilder();
    await categoryQuery.delete().execute();

    const vendorQuery = itemVendorService.getQueryBuilder();
    await vendorQuery.delete().execute();

    const packageQuery = itemPackageService.getQueryBuilder();
    await packageQuery.delete().execute();
    */
    await cleanupTestingDatabaseLayerZERO(module);

    const measureQuery = measureService.getQueryBuilder();
    await measureQuery.delete().execute();
    
    const sizeQuery = sizeService.getQueryBuilder();
    await sizeQuery.delete().execute();

    const itemQuery = itemService.getQueryBuilder();
    await itemQuery.delete().execute();
  })

  it('should be defined', () => {
    expect(itemService).toBeDefined();
  });

  it('should create a inventory item', async () => {
    const category = await categoryService.findOneByName("food");
    if(!category){ throw new Error('category is null'); }

    const vendor = await vendorService.findOneByName("vendorA");
    if(!vendor){ throw new Error('vendor is null'); }

    const itemDto = itemFactory.createDtoInstance({
      name: "testItem",
      inventoryItemCategoryId: category?.id,
      vendorId: vendor?.id,
    });

    const result = await itemService.create(itemDto);
    
    // For future test
    testId = result?.id as number;

    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
  });

  it('should update a inventory item', async () => {
    const toUpdate = await itemService.findOne(testId);
    if(!toUpdate){ throw new Error('item to update is null'); }

    // create itemSize
    const unit = await measureService.findOneByName(LITER);
    if(!unit){ throw new Error('measure unit is null'); }

    const packageType = await packageService.findOneByName("bag");
    if(!packageType){ throw new Error('package type is null'); }

    const sizeDto = sizeFactory.createDtoInstance({
      unitOfMeasureId: unit?.id,
      inventoryPackageTypeId: packageType?.id,
      inventoryItemId: toUpdate?.id,
    })

    const size = await sizeService.create(sizeDto);
    if(!size || !size?.id){ throw new Error('size for updating is null'); }

    const category = await categoryService.findOneByName("dairy");
    if(!category){ throw new Error('category is null'); }

    const vendor = await vendorService.findOneByName("vendorB");
    if(!vendor){ throw new Error('vendor is null'); }

    toUpdate.category = category;
    toUpdate.vendor = vendor;
    toUpdate.sizes = [size];

    const result = await itemService.update(testId, toUpdate);
    expect(result).not.toBeNull();
    expect(result?.category?.id).toEqual(category?.id);
    expect(result?.vendor?.id).toEqual(vendor?.id);
    expect(result?.sizes[0]?.id).toEqual(size?.id);
  });

  it('should remove a inventory item', async () => {
    const toRemove = await itemService.remove(testId);
    expect(toRemove).toBeTruthy();

    const verify = await itemService.findOne(testId);
    expect(verify).toBeNull();
  });

  it('should insert testing items and get all items', async () => {
    const items = await itemFactory.getTestingItems();
    for(const item of items){
      await itemService.create(
        itemFactory.createDtoInstance({
          name: item.name,
          inventoryItemCategoryId: item.category?.id,
          vendorId: item.vendor?.id,
        })
      )
    }

    const results = await itemService.findAll();

    // For future test
    testIds = [results[0].id, results[1].id, results[2].id];

    expect(results).not.toBeNull();
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toEqual(items.length);
  });

  it('should get a inventory item by name', async () => {
    const result = await itemService.findOneByName(FOOD_A);
    expect(result).not.toBeNull();
  });

  it('should get inventory items from a list of ids', async () => {
    const results = await itemService.findEntitiesById(testIds);

    expect(results).not.toBeNull();
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toEqual(testIds.length);
  });
});