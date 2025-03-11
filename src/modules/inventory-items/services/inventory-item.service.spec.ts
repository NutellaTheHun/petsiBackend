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
import { FOOD_A, FOOD_CAT, VENDOR_A } from '../utils/constants';

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
    module = await getInventoryItemTestingModule();

    categoryService = module.get<InventoryItemCategoryService>(InventoryItemCategoryService);
    vendorService = module.get<InventoryItemVendorService>(InventoryItemVendorService);
    packageService = module.get<InventoryItemPackageService>(InventoryItemPackageService);

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

    const result = await itemService.update(testId, 
      itemFactory.createDtoInstance({
        name: toUpdate.name,
        inventoryItemCategoryId: toUpdate.category.id,
        sizeIds: [toUpdate.sizes[0].id],
        vendorId: toUpdate.vendor.id
      })
    );

    expect(result).not.toBeNull();
    expect(result?.category?.id).toEqual(category?.id);
    expect(result?.vendor?.id).toEqual(vendor?.id);
    if(result?.sizes){ expect(result?.sizes[0]?.id).toEqual(size?.id); }
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

  // test category changes
  //  test that category.items get updated
  //    on removal
  //      - old loses reference
  //    on update 
  //      - old loses reference
  //      - new gains reference
  it('should remove category.items reference when item.category is set to null', async () => {
    const item = await itemService.findOneByName(FOOD_A, ['category']);
    if(!item){ throw new Error('item is null'); }

    const category = await categoryService.findOneByName(FOOD_CAT, ['items']);
    if(!category){ throw new Error('category is null'); }

    expect(item.category?.id).toEqual(category.id);
    expect(category.items.findIndex(i => i.id === item.id)).not.toBe(-1);

    const updated = await itemService.update(item.id, 
      itemFactory.updateDtoInstance({
        inventoryItemCategoryId: 0,
      })
    );
    expect(updated).not.toBeNull();
    expect(updated?.category).toBeUndefined();

    const updatedCategory = await categoryService.findOneByName(FOOD_CAT, ['items']);
    if(!updatedCategory){ throw new Error('updated category is null'); } 
    expect(category.items.findIndex(i => i.id === item.id)).toBe(-1);
  });

  it('should remove category.items reference when item.category is set to a different category, and add reference to new category', async () => {

  });

  // test vendorId changes
  //  test that vendorId.items get updated
  //    on removal
  //      - old loses reference
  //    on update 
  //      - old loses reference
  //      - new gains reference
  it('should remove the items reference from vendor.items when item.vendor is set to null', async () => {

  });

  it('should remove the items reference from vendor.items when item.vendor is set to a different vendor, and update new vendor', async () => {

  });

  // test size changes
  // test that deleting sizes truly removes the size entity
  it('should remove size entites when item.size gets removed', async () => {

  });
});