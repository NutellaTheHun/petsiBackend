import { TestingModule } from '@nestjs/testing';
import { UnitCategoryService } from '../../unit-of-measure/services/unit-category.service';
import { UnitOfMeasureService } from '../../unit-of-measure/services/unit-of-measure.service';
import { GALLON, LITER } from '../../unit-of-measure/utils/constants';
import { InventoryItemSizeFactory } from '../factories/inventory-item-size.factory';
import { FOOD_A, FOOD_B } from '../utils/constants';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemCategoryService } from './inventory-item-category.service';
import { InventoryItemPackageService } from './inventory-item-package.service';
import { InventoryItemSizeService } from './inventory-item-size.service';
import { InventoryItemVendorService } from './inventory-item-vendor.service';
import { InventoryItemService } from './inventory-item.service';


describe('Inventory Item Size Service', () => {
  let sizeService: InventoryItemSizeService;
  let sizeFactory: InventoryItemSizeFactory;

  // depends on unitCategoryService
  let unitService: UnitOfMeasureService;
  let unitCategoryService: UnitCategoryService;

  let packageService: InventoryItemPackageService;

  // depends on itemCategoryService, and vendorService
  let itemService: InventoryItemService;
  let itemCategoryService: InventoryItemCategoryService;
  let itemVendorService: InventoryItemVendorService;

  let testId: number;
  let testIds: number[];

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();

    unitCategoryService = module.get<UnitCategoryService>(UnitCategoryService);
    await unitCategoryService.initializeDefaultCategories();

    unitService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
    await unitService.initializeDefaultUnits();

    packageService = module.get<InventoryItemPackageService>(InventoryItemPackageService);
    await packageService.initializeTestingDatabase();

    itemCategoryService = module.get<InventoryItemCategoryService>(InventoryItemCategoryService);
    await itemCategoryService.initializeTestingDatabase();

    itemVendorService = module.get<InventoryItemVendorService>(InventoryItemVendorService);
    await itemVendorService.initializeTestingDatabase();

    itemService = module.get<InventoryItemService>(InventoryItemService);
    await itemService.initializeTestingDatabase();

    sizeService = module.get<InventoryItemSizeService>(InventoryItemSizeService);
    sizeFactory = module.get<InventoryItemSizeFactory>(InventoryItemSizeFactory);
  });

  afterAll( async () => {
    const sizeQuery = sizeService.getQueryBuilder();
    await sizeQuery.delete().execute();
    
    const unitCategorQuery = unitCategoryService.getQueryBuilder();
    await unitCategorQuery.delete().execute();

    const unitQuery = unitService.getQueryBuilder();
    await unitQuery.delete().execute();

    const packageQuery = packageService.getQueryBuilder();
    await packageQuery.delete().execute();

    const itemCategoryQuery = itemCategoryService.getQueryBuilder();
    await itemCategoryQuery.delete().execute();

    const itemVendorQuery = itemVendorService.getQueryBuilder();
    await itemVendorQuery.delete().execute();

    const itemQuery = itemService.getQueryBuilder();
    await itemQuery.delete().execute();
  });

  it('should be defined', () => {
    expect(sizeService).toBeDefined();
  });
  
  it('should create a inventory item size', async () => {
    const unit = await unitService.findOneByName(LITER);
    if(!unit){ throw new Error('measure unit is null'); }

    const packageType = await packageService.findOneByName("bag");
    if(!packageType){ throw new Error('package type is null'); }

    const item = await itemService.findOneByName(FOOD_A);
    if(!item){ throw new Error('inventory item is null'); }

    const sizeDto = sizeFactory.createDtoInstance({ 
      unitOfMeasureId: unit?.id,
      inventoryPackageTypeId: packageType?.id,
      inventoryItemId: item?.id,
    });

    const result = await sizeService.create(sizeDto);

    // For future tests
    testId = result?.id as number;

    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
  });

  it('should update a inventory item size', async () => {
    const updateUnit = await unitService.findOneByName(GALLON);
    if(!updateUnit){ throw new Error('unit of measure to update with is null'); }

    const updatePackage = await packageService.findOneByName("box");
    if(!updatePackage){ throw new Error('pacakge to update with is null'); }

    const updateItem = await itemService.findOneByName(FOOD_B);
    if(!updateItem) { throw new Error('item to update with is null'); }

    const toUpdate = await sizeService.findOne(testId);
    if(!toUpdate){ throw new Error('size to update is null'); }


    const result = await sizeService.update(testId, {
      unitOfMeasureId: updateUnit.id,
      inventoryPackageTypeId: updatePackage.id,
      inventoryItemId: updateItem.id,
    });
    expect(result).not.toBeNull();
    expect(result?.item.id).toEqual(updateItem.id);
    expect(result?.measureUnit.id).toEqual(updateUnit.id);
    expect(result?.packageType.id).toEqual(updatePackage.id);
  });

  it('should remove a inventory item size', async () => {
    const removal = await sizeService.remove(testId);
    expect(removal).toBeTruthy();

    const verify = await sizeService.findOne(testId);
    expect(verify).toBeNull();
  });

  it('should insert tesing sizes and get all', async () => {
    const testingSizes = await sizeFactory.getTestingItemSizes();
    if(!testingSizes){ throw new Error('testing sizes is null'); }

    for(const size of testingSizes){
      await sizeService.create(
        sizeFactory.createDtoInstance({
          unitOfMeasureId: size.measureUnit.id,
          inventoryPackageTypeId: size.packageType.id,
          inventoryItemId: size.item.id,
        })
      )
    }

    const results = await sizeService.findAll();
    expect(results).not.toBeNull();
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toEqual(testingSizes.length);

    // for future tests
    testIds = [results[0].id, results[1].id, results[2].id];
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
});