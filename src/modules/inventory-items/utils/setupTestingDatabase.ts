
import { TestingModule } from "@nestjs/testing";
import { InventoryItemCategoryService } from "../services/inventory-item-category.service";
import { InventoryItemVendorService } from "../services/inventory-item-vendor.service";
import { InventoryItemPackageService } from "../services/inventory-item-package.service";
import { UnitCategoryService } from "../../unit-of-measure/services/unit-category.service";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { InventoryItemService } from "../services/inventory-item.service";
import { InventoryItemSizeService } from "../services/inventory-item-size.service";

/*
 Phases:
 0: Categories, Vendors, Packages, UnitOfMeasureModule.UnitCategory (0 Dependencies to insert)
 1: UnitOfMeasurement, InventoryItem(initializes with no sizes)
 2: ItemSizes, InventoryItem.sizes, UnitOfMeasure.baseUnits(if needed)
 */

/**
 * Calls initializeTestingDatabase() on:
 * InventoryItemCategory, InventoryItemVendor, InventoryItemPackage, UnitOfMeasureModule.UnitCategory
 */
export async function setupTestingDatabaseLayerZERO(module: TestingModule): Promise<void>{
    const itemCategoryService = module.get<InventoryItemCategoryService>(InventoryItemCategoryService);
    await itemCategoryService.initializeTestingDatabase();

    const itemVendorService = module.get<InventoryItemVendorService>(InventoryItemVendorService);
    await itemVendorService.initializeTestingDatabase();

    const itemPackageService = module.get<InventoryItemPackageService>(InventoryItemPackageService);
    await itemPackageService.initializeTestingDatabase();

    const measureCategoryService = module.get<UnitCategoryService>(UnitCategoryService);
    await measureCategoryService.initializeTestingDatabase();
}

/**
 * Clears all rows from tables for entites:
 * InventoryItemCategory, InventoryItemVendor, InventoryItemPackage, UnitOfMeasureModule.UnitCategory
 */
export async function cleanupTestingDatabaseLayerZERO(module: TestingModule): Promise<void> {
    const itemCategoryService = module.get<InventoryItemCategoryService>(InventoryItemCategoryService);
    await itemCategoryService.getQueryBuilder().delete().execute();

    const itemVendorService = module.get<InventoryItemVendorService>(InventoryItemVendorService);
    await itemVendorService.getQueryBuilder().delete().execute();

    const itemPackageService = module.get<InventoryItemPackageService>(InventoryItemPackageService);
    await itemPackageService.getQueryBuilder().delete().execute();

    const measureCategoryService = module.get<UnitCategoryService>(UnitCategoryService);
    await measureCategoryService.getQueryBuilder().delete().execute();
}

/**
 * Calls initializeTestingDatabase() on:
 * UnitOfMeasureModule.UnitOfMeasure, InventoryItem(doesn't depend on InventoryItemSize)
 */
export async function setupTestingDatabaseLayerONE(module: TestingModule): Promise<void>{
    await setupTestingDatabaseLayerZERO(module);

    const unitMeasureService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
    await unitMeasureService.initializeTestingDatabase();

    const itemService = module.get<InventoryItemService>(InventoryItemService);
    await itemService.initializeTestingDatabase();
}

/**
 * Clears all rows from tables for entites:
 * UnitOfMeasureModule.UnitOfMeasure, InventoryItem
 */
export async function cleanupTestingDatabaseLayerONE(module: TestingModule): Promise<void> {
    await cleanupTestingDatabaseLayerZERO(module);

    const unitMeasureService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
    await unitMeasureService.getQueryBuilder().delete().execute();

    const itemService = module.get<InventoryItemService>(InventoryItemService);
    await itemService.getQueryBuilder().delete().execute();
}

/**
 * Calls initializeTestingDatabase() on:
 * InventoryItemSize, InventoryItem.sizes[]
 */
export async function setupTestingDatabaseLayerTWO(module: TestingModule): Promise<void>{
    await setupTestingDatabaseLayerONE(module);

    const sizeService = module.get<InventoryItemSizeService>(InventoryItemSizeService);
    await sizeService.initializeTestingDatabase();

    //setup item.sizes[]

    //UnitOfMeasure.baseUnit (if needed)
}

/**
 * Clears all rows from tables for entites:
 * InventoryItemSize, InventoryItem
 */
export async function cleanupTestingDatabaseLayerTWO(module: TestingModule): Promise<void> {
    await cleanupTestingDatabaseLayerONE(module);

    const sizeService = module.get<InventoryItemSizeService>(InventoryItemSizeService);
    await sizeService.getQueryBuilder().delete().execute();
}