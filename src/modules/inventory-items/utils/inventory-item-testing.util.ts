import { Injectable } from "@nestjs/common";
import { InventoryItemVendorService } from "../services/inventory-item-vendor.service";
import { InventoryItemPackageService } from "../services/inventory-item-package.service";
import { InventoryItemCategoryService } from "../services/inventory-item-category.service";
import { InventoryItemSizeService } from "../services/inventory-item-size.service";
import { InventoryItemVendor } from "../entities/inventory-item-vendor.entity";
import { InventoryItemPackage } from "../entities/inventory-item-package.entity";
import { InventoryItemCategory } from "../entities/inventory-item-category.entity";
import { InventoryItem } from "../entities/inventory-item.entity";
import { InventoryItemSize } from "../entities/inventory-item-size.entity";
import { CreateInventoryItemVendorDto } from "../dto/create-inventory-item-vendor.dto";
import { CreateInventoryItemPackageDto } from "../dto/create-inventory-item-package.dto";
import { CreateInventoryItemCategoryDto } from "../dto/create-inventory-item-category.dto";
import * as CONSTANT from "./constants";
import { CreateInventoryItemDto } from "../dto/create-inventory-item.dto";
import { InventoryItemService } from "../services/inventory-item.service";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import * as UNIT_CONSTANT from "../../unit-of-measure/utils/constants";
import { CreateInventoryItemSizeDto } from "../dto/create-inventory-item-size.dto";

@Injectable()
export class InventoryItemTestingUtil {
    constructor(
        private readonly vendorService: InventoryItemVendorService,
        private readonly packageService: InventoryItemPackageService,
        private readonly categoryService: InventoryItemCategoryService,
        private readonly sizeService: InventoryItemSizeService,
        private readonly itemService: InventoryItemService,

        private readonly unitService: UnitOfMeasureService,
    ){ }

    public getTestInventoryItemVendorEntities(): InventoryItemVendor[] {
        return [
            { name: CONSTANT.VENDOR_A} as InventoryItemVendor,
            { name: CONSTANT.VENDOR_B} as InventoryItemVendor,
            { name: CONSTANT.VENDOR_C} as InventoryItemVendor,
        ];
    }

    public getTestInventoryItemPackageEntities(): InventoryItemPackage[] {
        return [
            { name: CONSTANT.BAG_PKG } as InventoryItemPackage,
            { name: CONSTANT.PACKAGE_PKG } as InventoryItemPackage,
            { name: CONSTANT.BOX_PKG } as InventoryItemPackage,
            { name: CONSTANT.OTHER_PKG } as InventoryItemPackage,
            { name: CONSTANT.CONTAINER_PKG } as InventoryItemPackage,
            { name: CONSTANT.CAN_PKG } as InventoryItemPackage
        ];
    }

    public getTestInventoryItemCategoryEntities(): InventoryItemCategory[] {
        return [
            { name: CONSTANT.FOOD_CAT } as InventoryItemCategory,
            { name: CONSTANT.OTHER_CAT } as InventoryItemCategory,
            { name: CONSTANT.DRYGOOD_CAT } as InventoryItemCategory,
            { name: CONSTANT.DAIRY_CAT } as InventoryItemCategory,
        ];
    }

    public async getTestInventoryItemEntities(): Promise<InventoryItem[]>{
        const vendorA = await this.vendorService.findOneByName(CONSTANT.VENDOR_A);
        const vendorB = await this.vendorService.findOneByName(CONSTANT.VENDOR_B);
        const vendorC = await this.vendorService.findOneByName(CONSTANT.VENDOR_C);

        const foodCat = await this.categoryService.findOneByName(CONSTANT.FOOD_CAT);
        const dryGoodsCat = await this.categoryService.findOneByName(CONSTANT.DRYGOOD_CAT);
        const otherCat = await this.categoryService.findOneByName(CONSTANT.OTHER_CAT);

        return [
            { name: CONSTANT.FOOD_A, category: foodCat, vendor: vendorA } as InventoryItem,
            { name: CONSTANT.DRY_A, category: dryGoodsCat, vendor: vendorA } as InventoryItem,
            { name: CONSTANT.OTHER_A, category: otherCat, vendor: vendorA } as InventoryItem,

            { name: CONSTANT.FOOD_B, category: foodCat, vendor: vendorB } as InventoryItem,
            { name: CONSTANT.DRY_B, category: dryGoodsCat, vendor: vendorB } as InventoryItem,
            { name: CONSTANT.OTHER_B, category: otherCat, vendor: vendorB } as InventoryItem,

            { name: CONSTANT.FOOD_C, category: foodCat, vendor: vendorC } as InventoryItem,
            { name: CONSTANT.DRY_C, category: dryGoodsCat, vendor: vendorC } as InventoryItem,
            { name: CONSTANT.OTHER_C, category: otherCat, vendor: vendorC } as InventoryItem,
        ];
    }

    public async getTestInventoryItemSizeEntities(): Promise<InventoryItemSize[]> {
        return [
            {
                measureUnit: await this.unitService.findOneByName(UNIT_CONSTANT.POUND),
                packageType: await this.packageService.findOneByName(CONSTANT.BOX_PKG),
                item: await this.itemService.findOneByName(CONSTANT.FOOD_A),
            } as InventoryItemSize, 
            {
                measureUnit: await this.unitService.findOneByName(UNIT_CONSTANT.GALLON),
                packageType: await this.packageService.findOneByName(CONSTANT.CONTAINER_PKG),
                item: await this.itemService.findOneByName(CONSTANT.FOOD_A),
            } as InventoryItemSize,
            {
                measureUnit: await this.unitService.findOneByName(UNIT_CONSTANT.KILOGRAM),
                packageType: await this.packageService.findOneByName(CONSTANT.PACKAGE_PKG),
                item: await this.itemService.findOneByName(CONSTANT.FOOD_B),
            } as InventoryItemSize,
            {
                measureUnit: await this.unitService.findOneByName(UNIT_CONSTANT.UNIT),
                packageType: await this.packageService.findOneByName(CONSTANT.OTHER_PKG),
                item: await this.itemService.findOneByName(CONSTANT.FOOD_B),
            } as InventoryItemSize,
            {
                measureUnit: await this.unitService.findOneByName(UNIT_CONSTANT.LITER),
                packageType: await this.packageService.findOneByName(CONSTANT.CONTAINER_PKG),
                item: await this.itemService.findOneByName(CONSTANT.FOOD_C),
            } as InventoryItemSize,
            {
                measureUnit: await this.unitService.findOneByName(UNIT_CONSTANT.MILLILITER),
                packageType: await this.packageService.findOneByName(CONSTANT.OTHER_PKG),
                item: await this.itemService.findOneByName(CONSTANT.FOOD_C),
            } as InventoryItemSize,
            {
                measureUnit: await this.unitService.findOneByName(UNIT_CONSTANT.OUNCE),
                packageType: await this.packageService.findOneByName(CONSTANT.BOX_PKG),
                item: await this.itemService.findOneByName(CONSTANT.DRY_A),
            } as InventoryItemSize,
            {
                measureUnit: await this.unitService.findOneByName(UNIT_CONSTANT.GRAM),
                packageType: await this.packageService.findOneByName(CONSTANT.CONTAINER_PKG),
                item: await this.itemService.findOneByName(CONSTANT.DRY_A),
            } as InventoryItemSize,
            {
                measureUnit: await this.unitService.findOneByName(UNIT_CONSTANT.EACH),
                packageType: await this.packageService.findOneByName(CONSTANT.OTHER_PKG),
                item: await this.itemService.findOneByName(CONSTANT.DRY_B),
            } as InventoryItemSize,
            {
                measureUnit: await this.unitService.findOneByName(UNIT_CONSTANT.POUND),
                packageType: await this.packageService.findOneByName(CONSTANT.BAG_PKG),
                item: await this.itemService.findOneByName(CONSTANT.DRY_B),
            } as InventoryItemSize,
            {
                measureUnit: await this.unitService.findOneByName(UNIT_CONSTANT.KILOGRAM),
                packageType: await this.packageService.findOneByName(CONSTANT.CAN_PKG),
                item: await this.itemService.findOneByName(CONSTANT.DRY_C),
            } as InventoryItemSize,
            {
                measureUnit: await this.unitService.findOneByName(UNIT_CONSTANT.UNIT),
                packageType: await this.packageService.findOneByName(CONSTANT.BAG_PKG),
                item: await this.itemService.findOneByName(CONSTANT.DRY_C),
            } as InventoryItemSize,
            {
                measureUnit: await this.unitService.findOneByName(UNIT_CONSTANT.FL_OUNCE),
                packageType: await this.packageService.findOneByName(CONSTANT.BOX_PKG),
                item: await this.itemService.findOneByName(CONSTANT.OTHER_A),
            } as InventoryItemSize, 
            {
                measureUnit: await this.unitService.findOneByName(UNIT_CONSTANT.GRAM),
                packageType: await this.packageService.findOneByName(CONSTANT.BAG_PKG),
                item: await this.itemService.findOneByName(CONSTANT.OTHER_B),
            } as InventoryItemSize,

            {
                measureUnit: await this.unitService.findOneByName(UNIT_CONSTANT.PINT),
                packageType: await this.packageService.findOneByName(CONSTANT.CONTAINER_PKG),
                item: await this.itemService.findOneByName(CONSTANT.OTHER_C),
            } as InventoryItemSize,
        ]
    }

    public async initializeInventoryItemVendorDatabaseTesting(): Promise<void> {
        const vendors = this.getTestInventoryItemVendorEntities();
        for(const vendor of vendors){
            await this.vendorService.create(
                { name: vendor.name } as CreateInventoryItemVendorDto
            )
        }
    }

    public async initializeInventoryItemPackageDatabaseTesting(): Promise<void> {
        const defaultPackages = await this.getTestInventoryItemPackageEntities();

        for(const pkg of defaultPackages){
            await this.packageService.create(
              { name: pkg.name } as CreateInventoryItemPackageDto
            )
        }
    }

    public async initializeInventoryItemCategoryDatabaseTesting(): Promise<void> {
        const categories = this.getTestInventoryItemCategoryEntities();

        for(const category of categories) {
            await this.categoryService.create(
                { name: category.name } as CreateInventoryItemCategoryDto
            )
        }
    }

    public async initializeInventoryItemDatabaseTesting(): Promise<void> {
        const items = await this.getTestInventoryItemEntities();

        for(const item of items){
            await this.itemService.create({
                    name: item.name,
                    inventoryItemCategoryId: item.category?.id,
                    vendorId: item.vendor?.id, 
                } as CreateInventoryItemDto
            )
        };
    }

    public async initializeInventoryItemSizeDatabaseTesting(): Promise<void> {
        const testingSizes = await this.getTestInventoryItemSizeEntities();

        for(const size of testingSizes){
            await this.sizeService.create({
                    unitOfMeasureId: size.measureUnit.id,
                    inventoryPackageTypeId: size.packageType.id,
                    inventoryItemId: size.item.id,
                } as CreateInventoryItemSizeDto 
            )
        }
    }
}