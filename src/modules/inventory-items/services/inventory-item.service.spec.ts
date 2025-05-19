import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { UnitOfMeasureService } from '../../unit-of-measure/services/unit-of-measure.service';
import { GALLON, KILOGRAM, POUND } from '../../unit-of-measure/utils/constants';
import { CreateChildInventoryItemSizeDto } from '../dto/inventory-item-size/create-child-inventory-item-size.dto';
import { CreateInventoryItemDto } from '../dto/inventory-item/create-inventory-item.dto';
import { UpdateChildInventoryItemSizeDto } from '../dto/inventory-item-size/update-child-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../dto/inventory-item-size/update-inventory-item-size.dto';
import { UpdateInventoryItemDto } from '../dto/inventory-item/update-inventory-item.dto';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { BOX_PKG, CAN_PKG, DAIRY_CAT, DRYGOOD_CAT, FOOD_CAT, OTHER_PKG, VENDOR_A, VENDOR_B } from '../utils/constants';
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
  let invItemSizesTestId: number;
  let oldCategoryId: number;
  let newCategoryId: number;
  let oldVendorId: number;
  let newVendorId: number;
  let sizeId: number;

  let updateItemSizeId: number;
  let updateItemPkgId: number;
  let newUnitId: number;
  let newPkgId: number;
  let deletedSizeId: number;
  let savedSizeId: number;

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
      name: "test item default vend/cat",
    } as CreateInventoryItemDto;
    const result = await itemService.create(dto);

    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
    expect(result?.name).toEqual("test item default vend/cat");

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

  // should create inventory-item with item sizes
  it('should create an inventory item with item sizes', async () => {
    // packageIds
    const packageIds = (await packageService.findAll()).items.map(pkg => pkg.id).slice(0,2);
    // measureIds
    const measureIds = (await measureService.findAll()).items.map(unit => unit.id).slice(0,2);

    const sizeDtos = testingUtil.createChildInventoryItemSizeDtos(
      2,
      packageIds,
      measureIds,
      [9.99, 12],
    );

    const cat = await categoryService.findOneByName(DRYGOOD_CAT);
    if(!cat){ throw new NotFoundException(); }

    const vend = await vendorService.findOneByName(VENDOR_B);
    if(!vend){ throw new NotFoundException(); }

    const itemDto = {
      name: "testItemWithSizeDtos",
      itemSizeDtos: sizeDtos,
      vendorId: vend.id,
      inventoryItemCategoryId: cat.id,
      
    } as CreateInventoryItemDto;

    const result = await itemService.create(itemDto);
    if(!result?.sizes){ throw new Error("result sizes is null"); }

    expect(result).not.toBeNull();
    expect(result?.name).toEqual("testItemWithSizeDtos")
    expect(result.sizes.length).toEqual(2);
    for(const size of result.sizes){
      expect(measureIds.findIndex(id => id === size.measureUnit.id)).not.toEqual(-1);
      expect(packageIds.findIndex(id => id === size.packageType.id)).not.toEqual(-1);
      expect(["9.99", "12"]).toContain(size.cost);
    }

    invItemSizesTestId = result?.id as number;
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
    expect(result?.category).toBeNull();
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
    expect(result?.vendor).toBeNull();
  });

  it('old vendor should loose reference to item', async () => {
    const newVend = await vendorService.findOne(newVendorId, ['items']);
    if(!newVend){ throw new NotFoundException(); }

    expect(newVend.items.findIndex(item => item.id === testId)).toEqual(-1);
  });

  it('should modify a item size, and item should gain reference to modified size', async () => {
    const item = await itemService.findOne(invItemSizesTestId, ['sizes']);
    if(!item){ throw new NotFoundException(); }
    if(!item.sizes){ throw new Error("item sizes are null"); }
    
    const sizes = await sizeService.findEntitiesById(item.sizes.map(size => size.id), ['item','measureUnit','packageType']);
    if(!sizes){ throw new Error("queried sizes are null"); }

    updateItemSizeId = item.sizes[0].id;

    let newUnit: UnitOfMeasure;
    if(sizes[0].measureUnit.name === POUND){
      const unit = await measureService.findOneByName(KILOGRAM);
      if(!unit){ throw new NotFoundException(); }
      newUnit = unit;
      newUnitId = newUnit.id;
    } else {
      const unit = await measureService.findOneByName(POUND);
      if(!unit){ throw new NotFoundException(); }
      newUnit = unit;
      newUnitId = newUnit.id;
    }
    
    const updateSizeDtos = [
      {
      mode:'update',
      id: item.sizes[0].id,
      unitOfMeasureId: newUnit.id,
      inventoryPackageTypeId: sizes[0].packageType.id,
      cost: 12.50,
      } as UpdateChildInventoryItemSizeDto,
      {
      mode:'update',
      id: item.sizes[1].id,
      unitOfMeasureId: sizes[1].measureUnit.id,
      inventoryPackageTypeId: sizes[1].packageType.id,
      } as UpdateChildInventoryItemSizeDto,
    ]

    const updateDto = {
      sizeDtos: updateSizeDtos,
    } as UpdateInventoryItemDto

    const result = await itemService.update(invItemSizesTestId, updateDto);
    if(!result){ throw new Error("item update is null"); }
    if(!result?.sizes){ throw new Error("result sizes is null"); }

    expect(result).not.toBeNull();
    expect(result.sizes.length).toEqual(2);

    // should reflect updated item size when queried
    const updatedSize = await sizeService.findOne(updateItemSizeId, ['measureUnit']);
    if(!updatedSize){ throw new NotFoundException(); }
    expect(updatedSize.measureUnit.id).toEqual(newUnitId);
    
    expect(updatedSize.cost).toEqual("12.50");
  });

  it('should update inventory item with removed item size', async () => {
    const item = await itemService.findOne(invItemSizesTestId, ['sizes']);
    if(!item){ throw new NotFoundException(); }
    if(!item.sizes){ throw new Error("item sizes are null"); }

    const sizes = await sizeService.findEntitiesById(item.sizes.map(size => size.id), ['item','measureUnit','packageType']);
    if(!sizes){ throw new Error("queried sizes are null"); }

    deletedSizeId = sizes[0].id;
    savedSizeId = sizes[1].id;

    const updateSizeDtos = [
      {
        mode:'update',
        id: sizes[1].id,
      } as UpdateChildInventoryItemSizeDto,
    ];

    const updateDto = {
      sizeDtos: updateSizeDtos,
    } as UpdateInventoryItemDto

    const result = await itemService.update(invItemSizesTestId, updateDto);
    if(!result){ throw new Error("item update is null"); }
    if(!result?.sizes){ throw new Error("result sizes is null"); }

    expect(result).not.toBeNull();
    expect(result.sizes.length).toEqual(1);
    expect(result.sizes[0].id).toEqual(savedSizeId);
  });

  it('deleted itemSize from item update should not exist', async () => {
    await expect(sizeService.findOne(deletedSizeId)).rejects.toThrow(NotFoundException);
  });

  it('should update item with both a new and modified size', async () => {
    const item = await itemService.findOne(invItemSizesTestId, ['sizes']);
    if(!item){ throw new NotFoundException(); }
    if(!item.sizes){ throw new Error("item sizes are null"); }
    const sizes = await sizeService.findEntitiesById(item.sizes.map(size => size.id), ['item','measureUnit','packageType']);
    if(!sizes){ throw new Error("queried sizes are null"); }

    updateItemPkgId = item.sizes[0].id;

    let newPackage: InventoryItemPackage;
    if(sizes[0].packageType.name === BOX_PKG){
      const pkg = await packageService.findOneByName(CAN_PKG);
      if(!pkg){ throw new NotFoundException(); }
      newPackage = pkg;
      newPkgId = newPackage.id;
    } else {
      const pkg = await packageService.findOneByName(BOX_PKG);
      if(!pkg){ throw new NotFoundException(); }
      newPackage = pkg;
      newPkgId = newPackage.id;
    }
    
    const createUnit = await measureService.findOneByName(GALLON)
    if(!createUnit){ throw new NotFoundException(); }
    const createPkg = await packageService.findOneByName(OTHER_PKG)
    if(!createPkg){ throw new NotFoundException(); }

    const sizeDtos = [
      {
        mode:'update',
        id: sizes[0].id,
        unitOfMeasureId: sizes[0].measureUnit.id,
        inventoryPackageTypeId: sizes[0].packageType.id,
      } as UpdateChildInventoryItemSizeDto,
      {
        mode:'create',
        unitOfMeasureId: createUnit.id,
        inventoryPackageTypeId: createPkg.id,
        cost: 7.01,
        measureAmount: 1,
      } as CreateChildInventoryItemSizeDto,
    ]

    const updateDto = {
      sizeDtos: sizeDtos,
    } as UpdateInventoryItemDto

    const result = await itemService.update(invItemSizesTestId, updateDto);
    if(!result){ throw new Error("item update is null"); }
    if(!result?.sizes){ throw new Error("result sizes is null"); }

    expect(result).not.toBeNull();
    expect(result.sizes.length).toEqual(2);
  });

  //find ALL
  it('should get all items', async () => {
    const results = await itemService.findAll({ limit: 20 });
    expect(results.items.length).toEqual(12) //9 from initTestItems, 3 from create methods

    testIds = [results.items[0].id, results.items[1].id, results.items[2].id];
  });

  //find by IDS
  it('should get items by list of ids', async () => {
    const results = await itemService.findEntitiesById(testIds);
    expect(results.length).toEqual(testIds.length);
  });

  // remove
  it('should remove an item', async () => {
    const itemToRemove = await itemService.findOne(invItemSizesTestId, ['sizes', 'category', 'vendor']);
    if(!itemToRemove){ throw new NotFoundException(); }
    if(!itemToRemove.sizes){ throw new Error("sizes is null"); }
    expect(itemToRemove.sizes?.length).toBeGreaterThan(0);

    removalId = itemToRemove.id;
    removalVendorId = itemToRemove.vendor?.id as number;
    removalCategoryId = itemToRemove.category?.id as number;
    removalSizeId = itemToRemove.sizes[0].id as number;

    const removal = await itemService.remove(removalId);
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
    const sizes = await sizeService.findSizesByItemName("testItemWithSizeDtos");
    expect(sizes?.length).toEqual(0);
  });
});