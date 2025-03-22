
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
 2: ItemSizes, InventoryItem.sizes, UnitCategory.baseUnits(if needed)
 */

/**
 * Calls initializeTestingDatabase() on:
 * InventoryItemCategory, InventoryItemVendor, InventoryItemPackage, UnitOfMeasureModule.UnitCategory
 * - Phases:
 * - 0: Categories, Vendors, Packages, UnitOfMeasureModule.UnitCategory (0 Dependencies to insert)
 * - 1: UnitOfMeasurement, InventoryItem(initializes with no sizes)
 * - 2: ItemSizes, InventoryItem.sizes, UnitCategory.baseUnits(if needed)
 */
export async function setupInventoryItemTestingDatabaseLayerZERO(module: TestingModule): Promise<void>{
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
 * Calls initializeTestingDatabase() on:
 * UnitOfMeasureModule.UnitOfMeasure, InventoryItem(doesn't depend on InventoryItemSize)
 * , with required dependencies beforehand
 * - Phases:
 * - 0: Categories, Vendors, Packages, UnitOfMeasureModule.UnitCategory (0 Dependencies to insert)
 * - 1: UnitOfMeasurement, InventoryItem(initializes with no sizes)
 * - 2: ItemSizes, InventoryItem.sizes, UnitCategory.baseUnits(if needed)
 */
export async function setupInventoryItemTestingDatabaseLayerONE(module: TestingModule): Promise<void>{
    await setupInventoryItemTestingDatabaseLayerZERO(module);

    const unitMeasureService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
    await unitMeasureService.initializeTestingDatabase();

    const itemService = module.get<InventoryItemService>(InventoryItemService);
    await itemService.initializeTestingDatabase();
}

/**
 * Calls initializeTestingDatabase() on:
 * InventoryItemSize, InventoryItem.sizes[], with required dependencies beforehand
 * - Phases:
 * - 0: Categories, Vendors, Packages, UnitOfMeasureModule.UnitCategory (0 Dependencies to insert)
 * - 1: UnitOfMeasurement, InventoryItem(initializes with no sizes)
 * - 2: ItemSizes, InventoryItem.sizes
 */
export async function setupInventoryItemTestingDatabaseLayerTWO(module: TestingModule): Promise<void>{
    await setupInventoryItemTestingDatabaseLayerONE(module);

    const sizeService = module.get<InventoryItemSizeService>(InventoryItemSizeService);
    await sizeService.initializeTestingDatabase();
}

/**
 * Clears all rows from tables for entites:
 * InventoryItemCategory, InventoryItemVendor, InventoryItemPackage, UnitOfMeasureModule.UnitCategory
 * - Phases:
 * - 0: Categories, Vendors, Packages, UnitOfMeasureModule.UnitCategory (0 Dependencies to insert)
 * - 1: UnitOfMeasurement, InventoryItem(initializes with no sizes)
 * - 2: ItemSizes, InventoryItem.sizes, UnitCategory.baseUnits(if needed)
 */
export async function cleanupInventoryItemTestingDatabaseLayerZERO(module: TestingModule): Promise<void> {
    await module.get<InventoryItemVendorService>(InventoryItemVendorService)
        .getQueryBuilder().delete().execute();

    await module.get<InventoryItemCategoryService>(InventoryItemCategoryService)
        .getQueryBuilder().delete().execute();

    await module.get<InventoryItemPackageService>(InventoryItemPackageService)
        .getQueryBuilder().delete().execute();

    await module.get<UnitCategoryService>(UnitCategoryService)
        .getQueryBuilder().delete().execute();
}

/**
 * Clears all rows from tables for entites:
 * UnitOfMeasureModule.UnitOfMeasure, InventoryItem
 * - Phases:
 * - 0: Categories, Vendors, Packages, UnitOfMeasureModule.UnitCategory (0 Dependencies to insert)
 * - 1: UnitOfMeasurement, InventoryItem(initializes with no sizes)
 * - 2: ItemSizes, InventoryItem.sizes, UnitCategory.baseUnits(if needed)
 */
export async function cleanupInventoryItemTestingDatabaseLayerONE(module: TestingModule): Promise<void> {
    await cleanupInventoryItemTestingDatabaseLayerZERO(module);

    await module.get<UnitOfMeasureService>(UnitOfMeasureService)
        .getQueryBuilder().delete().execute();
    await module.get<InventoryItemService>(InventoryItemService)
        .getQueryBuilder().delete().execute();
}

/**
 * Clears all rows from tables for entites:
 * InventoryItemSize, InventoryItem
 * - Phases:
 * - 0: Categories, Vendors, Packages, UnitOfMeasureModule.UnitCategory (0 Dependencies to insert)
 * - 1: UnitOfMeasurement, InventoryItem(initializes with no sizes)
 * - 2: ItemSizes, InventoryItem.sizes, UnitCategory.baseUnits(if needed)
 */
export async function cleanupInventoryItemTestingDatabaseLayerTWO(module: TestingModule): Promise<void> {
    await cleanupInventoryItemTestingDatabaseLayerONE(module);

    await module.get<InventoryItemSizeService>(InventoryItemSizeService)
        .getQueryBuilder().delete().execute();
}