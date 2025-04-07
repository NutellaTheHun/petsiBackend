import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { UnitOfMeasureService } from '../../unit-of-measure/services/unit-of-measure.service';
import { POUND } from '../../unit-of-measure/utils/constants';
import { CreateInventoryItemSizeDto } from '../dto/create-inventory-item-size.dto';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/update-inventory-item.dto';
import { BOX_PKG, DAIRY_CAT, DRYGOOD_CAT, FOOD_A, FOOD_CAT, NO_CAT, NO_VENDOR, VENDOR_A, VENDOR_B } from '../utils/constants';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemCategoryService } from './inventory-item-category.service';
import { InventoryItemPackageService } from './inventory-item-package.service';
import { InventoryItemSizeService } from './inventory-item-size.service';
import { InventoryItemVendorService } from './inventory-item-vendor.service';
import { InventoryItemService } from './inventory-item.service';

describe('Inventory Item Service', () => {
  let module: TestingModule;
  let testingUtil: InventoryItemTestingUtil;
  let dbTestContext: DatabaseTestContext;
  
  let itemService: InventoryItemService;

  let testId: number;
  let testIds: number[];
  let oldCategoryId: number;
  let newCategoryId: number;
  let oldVendorId: number;
  let newVendorId: number;
  let sizeId: number;

  let removalId: number;
  let removalCategoryId: number;
  let removalVendorId: number;
  let removalSizeId: number;

  let categoryService: InventoryItemCategoryService;
  let packageService: InventoryItemPackageService;
  let sizeService: InventoryItemSizeService;
  let vendorService: InventoryItemVendorService;
  let measureService: UnitOfMeasureService;

  

  beforeAll(async () => {
    module = await getInventoryItemTestingModule();
    testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
    dbTestContext = new DatabaseTestContext();
    await testingUtil.initInventoryItemSizeTestDatabase(dbTestContext);

    categoryService = module.get<InventoryItemCategoryService>(InventoryItemCategoryService);
    vendorService = module.get<InventoryItemVendorService>(InventoryItemVendorService);
    packageService = module.get<InventoryItemPackageService>(InventoryItemPackageService);

    measureService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
    sizeService = module.get<InventoryItemSizeService>(InventoryItemSizeService);
    itemService = module.get<InventoryItemService>(InventoryItemService);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  })

  it('should be defined', () => {
    expect(itemService).toBeDefined();
  });

  // create
  it('should create an inventory-item (Default Category and Vendor)', async () => {
    const dto = {
      name: "test item default vend/cat"
    } as CreateInventoryItemDto;
    const result = await itemService.create(dto);

    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
    expect(result?.name).toEqual("test item default vend/cat");
    expect(result?.category?.name).toEqual(NO_CAT);
    expect(result?.vendor?.name).toEqual(NO_VENDOR);

    testId = result?.id as number;
  });

  it('should create an inventory-item with category and vendor', async () => {
    const cat = await categoryService.findOneByName(FOOD_CAT);
    if(!cat){ throw new NotFoundException(); }

    const vend = await vendorService.findOneByName(VENDOR_A);
    if(!vend){ throw new NotFoundException(); }

    const dto = {
      name: "test Item with vend/cat",
      vendorId: vend.id,
      inventoryItemCategoryId: cat.id,
    } as CreateInventoryItemDto;
    const result = await itemService.create(dto);

    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
    expect(result?.name).toEqual("test Item with vend/cat");
    expect(result?.category?.name).toEqual(FOOD_CAT);
    expect(result?.vendor?.name).toEqual(VENDOR_A);
  });

  // find one by name
  it('should find an item by name', async () => {
    const result = await itemService.findOneByName("test item default vend/cat");
    expect(result?.id).not.toBeNull();
    expect(result?.name).toEqual("test item default vend/cat");
  });
  
  //findOne by ID
  it('should find an item by ID', async () => {
    const result = await itemService.findOne(testId);
    expect(result?.id).not.toBeNull();
    expect(result?.name).toEqual("test item default vend/cat");
  });

  // update
  it('should update item name', async () => {
    const dto = {
      name: "Updated item name"
    } as UpdateInventoryItemDto;
    const result = await itemService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.name).toEqual("Updated item name");
  });

  it('should update item category', async () => {
    const category = await categoryService.findOneByName(DAIRY_CAT);
    if(!category){ throw new NotFoundException(); }

    const dto = {
      inventoryItemCategoryId: category.id
    } as UpdateInventoryItemDto;
    const result = await itemService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.category?.id).toEqual(category.id);

    oldCategoryId = category.id;
  });

  it('new category should gain reference to item', async () => {
    const oldCat = await categoryService.findOne(oldCategoryId, ['items']);
    if(!oldCat){ throw new NotFoundException(); }

    expect(oldCat.items.findIndex(item => item.id === testId)).not.toEqual(-1);
  });

  it('should update item category to a new category', async () => {
    const category = await categoryService.findOneByName(DRYGOOD_CAT);
    if(!category){ throw new NotFoundException(); }

    const dto = {
      inventoryItemCategoryId: category.id
    } as UpdateInventoryItemDto;
    const result = await itemService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.category?.id).toEqual(category.id);

    newCategoryId = category.id;
  });

  it('old item category should loose reference to item', async () => {
    const oldCat = await categoryService.findOne(oldCategoryId, ['items']);
    if(!oldCat){ throw new NotFoundException(); }

    expect(oldCat.items.findIndex(item => item.id === testId)).toEqual(-1);
  });

  it('new item category should gain reference to item', async () => {
    const newCat = await categoryService.findOne(newCategoryId, ['items']);
    if(!newCat){ throw new NotFoundException(); }

    expect(newCat.items.findIndex(item => item.id === testId)).not.toEqual(-1);
  });

  it('should update item category to no category', async () => {
    const dto = {
      inventoryItemCategoryId: 0,
    } as UpdateInventoryItemDto;
    const result = await itemService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.category?.name).toEqual(NO_CAT);
  });

  it('old item category should loose reference to item', async () => {
    const newCat = await categoryService.findOne(newCategoryId, ['items']);
    if(!newCat){ throw new NotFoundException(); }

    expect(newCat.items.findIndex(item => item.id === testId)).toEqual(-1);
  });

  it('should update item vendor', async () => {
    const vendor = await vendorService.findOneByName(VENDOR_A);
    if(!vendor){ throw new NotFoundException(); }

    const dto = {
      vendorId: vendor.id
    } as UpdateInventoryItemDto;
    const result = await itemService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.vendor?.id).toEqual(vendor.id);

    oldVendorId = vendor.id;
  });

  it('vendor should gain reference to item', async () => {
    const oldVend = await vendorService.findOne(oldVendorId, ['items']);
    if(!oldVend){ throw new NotFoundException(); }

    expect(oldVend.items.findIndex(item => item.id === testId)).not.toEqual(-1);
  });

  it('should update item vendor to a new vendor', async () => {
    const vendor = await vendorService.findOneByName(VENDOR_B);
    if(!vendor){ throw new NotFoundException(); }

    const dto = {
      vendorId: vendor.id
    } as UpdateInventoryItemDto;
    const result = await itemService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.vendor?.id).toEqual(vendor.id);

    newVendorId = vendor.id;
  });

  it('old vendor should loose reference to item', async () => {
    const oldVend = await vendorService.findOne(oldVendorId, ['items']);
    if(!oldVend){ throw new NotFoundException(); }

    expect(oldVend.items.findIndex(item => item.id === testId)).toEqual(-1);
  });

  it('new vendor should gain reference to item', async () => {
    const newVend = await vendorService.findOne(newVendorId, ['items']);
    if(!newVend){ throw new NotFoundException(); }

    expect(newVend.items.findIndex(item => item.id === testId)).not.toEqual(-1);
  });

  it('should update item vendor to no vendor', async () => {
    const dto = {
      vendorId: 0
    } as UpdateInventoryItemDto;
    const result = await itemService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.vendor?.name).toEqual(NO_VENDOR);
  });

  it('old vendor should loose reference to item', async () => {
    const newVend = await vendorService.findOne(newVendorId, ['items']);
    if(!newVend){ throw new NotFoundException(); }

    expect(newVend.items.findIndex(item => item.id === testId)).toEqual(-1);
  });

  it('should add new item size, and item should gain reference to new size', async () => {
    const unit = await measureService.findOneByName(POUND);
    if(!unit){ throw new NotFoundException(); }

    const pkg = await packageService.findOneByName(BOX_PKG);
    if(!pkg){ throw new NotFoundException(); }

    const dto = {
      unitOfMeasureId: unit.id,
      inventoryPackageTypeId: pkg.id,
      inventoryItemId: testId
    } as CreateInventoryItemSizeDto;
    const result = await sizeService.create(dto);
    if(!result){ throw Error("size creation result is null"); }

    sizeId = result.id;

    const testItem = await itemService.findOne(testId, ['sizes']);
    if(!testItem){ throw new NotFoundException(); }

    expect(testItem.sizes?.findIndex(size => size.id === sizeId)).not.toEqual(-1);
  });

  it('should remove item size, and item should lose reference to size', async () => {
    const removal = sizeService.remove(sizeId);
    if(!removal){ throw new Error("size removal failed"); }

    const testItem = await itemService.findOne(testId, ['sizes']);
    if(!testItem){ throw new NotFoundException(); }

    expect(testItem.sizes?.findIndex(size => size.id === sizeId)).toEqual(-1);
  });

  //find ALL
  it('should get all items', async () => {
    const results = await itemService.findAll();
    expect(results.length).toEqual(11) //9 from initTestItems, 2 from create methods

    testIds = [results[0].id, results[1].id, results[2].id];
  });

  //find by IDS
  it('should get items by list of ids', async () => {
    const results = await itemService.findEntitiesById(testIds);
    expect(results.length).toEqual(testIds.length);
  });

  // remove
  it('should remove an item', async () => {
    const itemToRemove = await itemService.findOneByName(FOOD_A,['sizes', 'category', 'vendor']);
    if(!itemToRemove){ throw new NotFoundException(); }
    if(!itemToRemove.sizes){ throw new Error("sizes is null"); }
    expect(itemToRemove.sizes?.length).toBeGreaterThan(0);

    removalId = itemToRemove.id;
    removalVendorId = itemToRemove.vendor?.id as number;
    removalCategoryId = itemToRemove.category?.id as number;
    removalSizeId = itemToRemove.sizes[0].id as number;

    const removal = await itemService.remove(testId);
    expect(removal).toBeTruthy();
  });

  it('removed item\'s vendor should lose reference to item', async () => {
    const vendor = await vendorService.findOne(removalVendorId, ['items']);
    if(!vendor){ throw new NotFoundException(); }
    expect(vendor.items.findIndex(item => item.id === removalId)).toEqual(-1);
  });

  it('removed item\'s category should lose reference to item', async () => {
    const category = await categoryService.findOne(removalCategoryId, ['items']);
    if(!category){ throw new NotFoundException(); }
    expect(category.items.findIndex(item => item.id === removalId)).toEqual(-1);
  });

  it('removed item\'s sizes should be deleted', async () => {
    const sizes = await sizeService.findSizesByItemName(FOOD_A);
    expect(sizes?.length).toEqual(0);
  });
});