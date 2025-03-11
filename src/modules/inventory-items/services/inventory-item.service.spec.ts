import { TestingModule } from '@nestjs/testing';
import { InventoryItemService } from './inventory-item.service';
import { InventoryItemFactory } from '../factories/inventory-item.factory';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemCategoryService } from './inventory-item-category.service';
import { InventoryItemSizeService } from './inventory-item-size.service';
import { InventoryItemVendorService } from './inventory-item-vendor.service';
import { InventoryItemPackageService } from './inventory-item-package.service';
import { UnitOfMeasureService } from '../../unit-of-measure/services/unit-of-measure.service';


describe('Inventory Item Service', () => {
  let itemService: InventoryItemService;
  let factory: InventoryItemFactory;

  let testId: number;
  let testIds: number[];

  let itemCategoryService: InventoryItemCategoryService;
  let itemPackageService: InventoryItemPackageService;
  let itemSizeService: InventoryItemSizeService;
  let itemVendorService: InventoryItemVendorService;

  let measureService: UnitOfMeasureService;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();

    itemCategoryService = module.get<InventoryItemCategoryService>(InventoryItemCategoryService);
    await itemCategoryService.initializeTestingDatabase();

    itemVendorService = module.get<InventoryItemVendorService>(InventoryItemVendorService);
    await itemVendorService.initializeTestingDatabase();

    itemPackageService = module.get<InventoryItemPackageService>(InventoryItemPackageService);
    await itemPackageService.initializeTestingDatabase();

    measureService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
    await measureService.initializeTestingDatabase();

    // not initialized, depends on testing inventory items being populated.
    itemSizeService = module.get<InventoryItemSizeService>(InventoryItemSizeService);

    itemService = module.get<InventoryItemService>(InventoryItemService);
    factory = module.get<InventoryItemFactory>(InventoryItemFactory);
  });

  afterAll(async () => {
    const categoryQuery = itemCategoryService.getQueryBuilder();
    await categoryQuery.delete().execute();

    const vendorQuery = itemVendorService.getQueryBuilder();
    await vendorQuery.delete().execute();

    const packageQuery = itemPackageService.getQueryBuilder();
    await packageQuery.delete().execute();

    const measureQuery = measureService.getQueryBuilder();
    await measureQuery.delete().execute();

    const sizeQuery = itemSizeService.getQueryBuilder();
    await sizeQuery.delete().execute();

    const itemQuery = itemService.getQueryBuilder();
    await itemQuery.delete().execute();
  })

  it('should be defined', () => {
    expect(itemService).toBeDefined();
  });

  it('should create a inventory item', async () => {

  });

  it('should update a inventory item', async () => {
    
  });

  it('should remove a inventory item', async () => {
    
  });

  it('should get all inventory items', async () => {
    
  });

  it('should get a inventory item by name', async () => {
    
  });

  it('should get inventory items from a list of ids', async () => {
    
  });
});