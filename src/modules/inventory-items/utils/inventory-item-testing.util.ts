import { forwardRef, Inject, Injectable } from "@nestjs/common";
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
import { InventoryItemVendorBuilder } from "../builders/inventory-item-vendor.builder";
import { InventoryItemSizeBuilder } from "../builders/inventory-item-size.builder";
import { InventoryItemCategoryBuilder } from "../builders/inventory-item-category.builder";
import { InventoryItemPackageBuilder } from "../builders/inventory-item-package.builder";
import { InventoryItemBuilder } from "../builders/inventory-item.builder";

@Injectable()
export class InventoryItemTestingUtil {
    private readonly vendorNames: string[] = [ CONSTANT.VENDOR_A, CONSTANT.VENDOR_B, CONSTANT.VENDOR_C ];
    
    private readonly categoryNames: string[] = [ CONSTANT.OTHER_CAT, CONSTANT.DRYGOOD_CAT, CONSTANT.DAIRY_CAT, CONSTANT.FOOD_CAT ];

    private readonly packageNames: string[] = [ 
        CONSTANT.BAG_PKG,       CONSTANT.PACKAGE_PKG, 
        CONSTANT.BOX_PKG,       CONSTANT.OTHER_PKG, 
        CONSTANT.CONTAINER_PKG, CONSTANT.CAN_PKG 
    ];

    private readonly itemNames: string[] = [
        CONSTANT.FOOD_A, CONSTANT.DRY_A, CONSTANT.OTHER_A,
        CONSTANT.FOOD_B, CONSTANT.DRY_B, CONSTANT.OTHER_B,
        CONSTANT.FOOD_C, CONSTANT.DRY_C, CONSTANT.OTHER_C,
    ];

    private readonly measureNames: string[] = [
        UNIT_CONSTANT.GALLON,     UNIT_CONSTANT.LITER, 
        UNIT_CONSTANT.MILLILITER, UNIT_CONSTANT.FL_OUNCE, 
        UNIT_CONSTANT.PINT,

        UNIT_CONSTANT.OUNCE, UNIT_CONSTANT.GRAM,
        UNIT_CONSTANT.POUND, UNIT_CONSTANT.KILOGRAM,

        UNIT_CONSTANT.UNIT, UNIT_CONSTANT.EACH,
    ];
    
    constructor(
        private readonly vendorService: InventoryItemVendorService,
        private readonly vendorBuilder: InventoryItemVendorBuilder,

        private readonly packageService: InventoryItemPackageService,
        private readonly packageBuilder: InventoryItemPackageBuilder,

        private readonly categoryService: InventoryItemCategoryService,
        private readonly categoryBuilder: InventoryItemCategoryBuilder,

        private readonly sizeService: InventoryItemSizeService,
        private readonly sizeBuilder: InventoryItemSizeBuilder,

        private readonly itemService: InventoryItemService,
        private readonly itemBuilder: InventoryItemBuilder,
    ){ }

    /**
     * 
     * @returns 3 vendors, VendorA, B, and C
     */
    public async getTestInventoryItemVendorEntities(): Promise<InventoryItemVendor[]> {
        const results: InventoryItemVendor[] = [];
        for(const name of this.vendorNames){
            results.push(
                await this.vendorBuilder.reset()
                    .name(name)
                    .build()
            )
        }
        return results;
    }

    /**
     * 
     * @returns 6 package types: bag, package, box, other, container, can
     */
    public async getTestInventoryItemPackageEntities(): Promise<InventoryItemPackage[]> {
        const results: InventoryItemPackage[] = [];
        for(const name of this.packageNames){
            results.push(
                await this.packageBuilder.reset()
                    .name(name)
                    .build()
            )
        }
        return results;
    }

    /**
     * 
     * @returns 4 Categories, FOOD, OTHER, DRYGOOD, DAIRY
     */
    public async getTestInventoryItemCategoryEntities(): Promise<InventoryItemCategory[]> {
        const results: InventoryItemCategory[] = [];
        for(const name of this.categoryNames){
            results.push(
                await this.categoryBuilder.reset()
                    .name(name)
                    .build()
            )
        }
        return results;
    }

    /**
     * 
     * @returns 9 Inventory Items
     */
    public async getTestInventoryItemEntities(): Promise<InventoryItem[]>{
        const results: InventoryItem[] = [];
        for(let i = 0; i < this.itemNames.length; i++){
            results.push(
                await this.itemBuilder.reset()
                    .name(this.itemNames[i])
                    .categoryByName(this.categoryNames[i % this.categoryNames.length])
                    .vendorByName(this.vendorNames[i % this.vendorNames.length])
                    .build()
            )  
        }
        return results;
    }

    /**
     * 
     * @returns 2 sizes for each inventory item (9 items)
     */
    public async getTestInventoryItemSizeEntities(): Promise<InventoryItemSize[]> {
        const results: InventoryItemSize[] = [];
        let msrIdx = 0;
        let pkgIdx = 0; 
        for(let i = 0; i < this.itemNames.length; i++){
            results.push(
                await this.sizeBuilder.reset()
                    .InventoryItemByName(this.itemNames[i])
                    .unitOfMeasureByName(this.measureNames[msrIdx++ % this.measureNames.length])
                    .packageByName(this.packageNames[pkgIdx++ % this.packageNames.length])
                    .build()
            );
            results.push(
                await this.sizeBuilder.reset()
                    .InventoryItemByName(this.itemNames[i])
                    .unitOfMeasureByName(this.measureNames[msrIdx++ % this.measureNames.length])
                    .packageByName(this.packageNames[pkgIdx++ % this.packageNames.length])
                    .build()
            );    
        }
        return results;
    }

    public async initializeInventoryItemVendorDatabaseTesting(): Promise<void> {
        const vendors = await this.getTestInventoryItemVendorEntities();
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
        const categories = await this.getTestInventoryItemCategoryEntities();

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