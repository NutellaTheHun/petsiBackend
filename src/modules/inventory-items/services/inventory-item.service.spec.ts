import { TestingModule } from '@nestjs/testing';
import { InventoryItemService } from './inventory-item.service';
import { InventoryItemFactory } from '../factories/inventory-item.factory';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemCategoryService } from './inventory-item-category.service';
import { InventoryItemSizeService } from './inventory-item-size.service';
import { InventoryItemVendorService } from './inventory-item-vendor.service';
import { InventoryItemPackageService } from './inventory-item-package.service';
import { UnitOfMeasureService } from '../../unit-of-measure/services/unit-of-measure.service';
import { cleanupInventoryItemTestingDatabaseLayerZERO, setupInventoryItemTestingDatabaseLayerZERO } from '../utils/setupTestingDatabase';
import { InventoryItemSizeFactory } from '../factories/inventory-item-size.factory';
import { LITER } from '../../unit-of-measure/utils/constants';
import { DRY_A, DRY_B, DRYGOOD_CAT, FOOD_A, FOOD_B, FOOD_CAT, VENDOR_A, VENDOR_B, VENDOR_C } from '../utils/constants';

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

    await setupInventoryItemTestingDatabaseLayerZERO(module);

    measureService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
    await measureService.initializeTestingDatabase();

    // not initialized, depends on testing inventory items being populated.
    sizeService = module.get<InventoryItemSizeService>(InventoryItemSizeService);

    itemService = module.get<InventoryItemService>(InventoryItemService);
    itemFactory = module.get<InventoryItemFactory>(InventoryItemFactory);

    sizeFactory = module.get<InventoryItemSizeFactory>(InventoryItemSizeFactory);
  });

  afterAll(async () => {
    await cleanupInventoryItemTestingDatabaseLayerZERO(module);

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
    expect(updated?.category).toBeNull();

    const updatedCategory = await categoryService.findOneByName(FOOD_CAT, ['items']);
    if(!updatedCategory){ throw new Error('updated category is null'); } 
    expect(updatedCategory.items.findIndex(i => i.id === item.id)).toBe(-1);
  });

  it('should remove category.items reference when item.category is set to a different category, and add reference to new category', async () => {
    const item = await itemService.findOneByName(FOOD_B, ['category']);
    if(!item){ throw new Error('item is null'); }

    const category = await categoryService.findOneByName(FOOD_CAT, ['items']);
    if(!category){ throw new Error('category is null'); }

    expect(item.category?.id).toEqual(category.id);
    expect(category.items.findIndex(i => i.id === item.id)).not.toBe(-1);

    const newCategory = await categoryService.findOneByName(DRYGOOD_CAT, ['items']);
    if(!newCategory){ throw new Error('new category is null'); }

    const updated = await itemService.update(item.id, 
      itemFactory.updateDtoInstance({
        inventoryItemCategoryId: newCategory?.id,
      })
    );

    expect(updated).not.toBeNull();
    expect(updated?.category?.id).toEqual(newCategory.id);
    
    const verifyNewCategory = await categoryService.findOneByName(DRYGOOD_CAT, ['items']);
    expect(verifyNewCategory?.items.findIndex(i => i.id === updated?.id)).not.toEqual(-1);

    const verifyOldCategory = await categoryService.findOneByName(FOOD_CAT, ['items']);
    expect(verifyOldCategory?.items.findIndex(i => i.id === updated?.id)).toEqual(-1);
  });

  it('should add to a category\'s sizes array when items is null, UPDATE METHOD', async () => {
    // get a category with no items (so items array shoud be null/undefined)
    const newCategory = await categoryService.findOneByName("produce");
    expect(newCategory?.items).toBeUndefined();

    // create new item, that will be assigned to the newCategory in an update call
    const newItem = await itemService.create(itemFactory.createDtoInstance({ 
      name: "newItem",
    }));
    if(!newItem || !newItem.id){ throw new Error('new item is null'); }

    // update item with newCategory, update should initialize array and procede as expected
    const result = await itemService.update(newItem?.id, 
      itemFactory.createDtoInstance({ 
        inventoryItemCategoryId: newCategory?.id,
    }));

    const verifyCategory = await categoryService.findOneByName("produce", ["items"]);
    expect(verifyCategory?.items).not.toBeNull();
    expect(verifyCategory?.items.findIndex(i => i.id === result?.id)).not.toEqual(-1);
  });

  it('should remove the items reference from vendor.items when item.vendor is set to null', async () => {
    const item = await itemService.findOneByName(DRY_A, ["vendor"]);
    if(!item){ throw new Error('item is null'); }

    const vendor = await vendorService.findOneByName(VENDOR_A, ["items"]);
    if(!vendor){ throw new Error('vendorA is null'); }

    expect(vendor.items.findIndex(i => i.id === item.id)).not.toEqual(-1);

    const itemDto = itemFactory.updateDtoInstance({
      vendorId: 0,
    });

    const result = await itemService.update(item.id, itemDto);
    expect(result).not.toBeNull();
    expect(result?.vendor).toBeNull();

    const verifyVendor = await vendorService.findOneByName(VENDOR_A, ["items"]);
    if(!verifyVendor){ throw new Error('verify vendorA is null'); }

    expect(verifyVendor.items.findIndex(i => i.id === result?.id)).toEqual(-1);
  });

  it('should remove the items reference from vendor.items when item.vendor is set to a different vendor, and update new vendor', async () => {
    const item = await itemService.findOneByName(DRY_B, ["vendor"]);
    if(!item){ throw new Error('item is null'); }

    const vendor = await vendorService.findOneByName(VENDOR_B, ["items"]);
    if(!vendor){ throw new Error('vendorB is null'); }

    expect(vendor.items.findIndex(i => i.id === item.id)).not.toEqual(-1);

    const newVendor = await vendorService.findOneByName(VENDOR_C);
    if(!newVendor){ throw new Error('vendorC is null'); }

    const itemDto = itemFactory.updateDtoInstance({
      vendorId: newVendor.id,
    });

    const result = await itemService.update(item.id, itemDto);
    expect(result).not.toBeNull();
    expect(result?.vendor?.id).toEqual(newVendor.id);

    const verifyOld = await vendorService.findOneByName(VENDOR_B, ["items"]);
    if(!verifyOld){ throw new Error('old vendor is null'); }
    expect(verifyOld.items.findIndex(i => i.id === result?.id)).toEqual(-1);

    const verifyNew = await vendorService.findOneByName(VENDOR_C, ["items"]);
    if(!verifyNew){ throw new Error('vendorC is null'); }
    expect(verifyNew.items.findIndex(i => i.id === result?.id)).not.toEqual(-1);
  });

  it('should remove size entites when item.size gets removed', async () => {

    // create item
    const itemDto = itemFactory.createDtoInstance({
      name: "testItemSize",
    });
    const itemCreateResult = await itemService.create(itemDto);
    if(!itemCreateResult){ throw new Error('created item is null');}

    // create itemSize
    const unit = await measureService.findOneByName(LITER);
    if(!unit){ throw new Error('measure unit is null'); }

    const packageType = await packageService.findOneByName("bag");
    if(!packageType){ throw new Error('package type is null'); }

    const sizeDto = sizeFactory.createDtoInstance({
      unitOfMeasureId: unit?.id,
      inventoryPackageTypeId: packageType?.id,
      inventoryItemId: itemCreateResult?.id,
    })

    const size = await sizeService.create(sizeDto);
    if(!size || !size?.id){ throw new Error('size is null'); } 

    const verifyCreate = await sizeService.findOne(size.id);
    if(!verifyCreate){ throw new Error('created size is null'); }

    const removeItem = await itemService.remove(itemCreateResult.id);
    expect(removeItem).toBeTruthy();

    const verifySizeRemove = await sizeService.findOne(size.id);
    expect(verifySizeRemove).toBeNull();
  });
});