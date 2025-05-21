import { Injectable } from "@nestjs/common";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import * as UNIT_CONSTANT from "../../unit-of-measure/utils/constants";
import { UnitOfMeasureTestingUtil } from "../../unit-of-measure/utils/unit-of-measure-testing.util";
import { InventoryItemCategoryBuilder } from "../builders/inventory-item-category.builder";
import { InventoryItemPackageBuilder } from "../builders/inventory-item-package.builder";
import { InventoryItemSizeBuilder } from "../builders/inventory-item-size.builder";
import { InventoryItemVendorBuilder } from "../builders/inventory-item-vendor.builder";
import { InventoryItemBuilder } from "../builders/inventory-item.builder";
import { CreateChildInventoryItemSizeDto } from "../dto/inventory-item-size/create-child-inventory-item-size.dto";
import { CreateInventoryItemCategoryDto } from "../dto/inventory-item-category/create-inventory-item-category.dto";
import { CreateInventoryItemSizeDto } from "../dto/inventory-item-size/create-inventory-item-size.dto";
import { CreateInventoryItemDto } from "../dto/inventory-item/create-inventory-item.dto";
import { InventoryItemCategory } from "../entities/inventory-item-category.entity";
import { InventoryItemPackage } from "../entities/inventory-item-package.entity";
import { InventoryItemSize } from "../entities/inventory-item-size.entity";
import { InventoryItemVendor } from "../entities/inventory-item-vendor.entity";
import { InventoryItem } from "../entities/inventory-item.entity";
import { InventoryItemCategoryService } from "../services/inventory-item-category.service";
import { InventoryItemPackageService } from "../services/inventory-item-package.service";
import { InventoryItemSizeService } from "../services/inventory-item-size.service";
import { InventoryItemVendorService } from "../services/inventory-item-vendor.service";
import { InventoryItemService } from "../services/inventory-item.service";
import * as CONSTANT from "./constants";
import { UpdateInventoryItemDto } from "../dto/inventory-item/update-inventory-item.dto";

@Injectable()
export class InventoryItemTestingUtil {
    private readonly vendorNames: string[] = [ CONSTANT.VENDOR_A, CONSTANT.VENDOR_B, CONSTANT.VENDOR_C ];
    
    private readonly categoryNames: string[] = [ CONSTANT.OTHER_CAT, CONSTANT.DRYGOOD_CAT, CONSTANT.DAIRY_CAT, CONSTANT.FOOD_CAT ];

    private readonly packageNames: string[] = [ 
        CONSTANT.BAG_PKG, CONSTANT.PACKAGE_PKG, 
        CONSTANT.BOX_PKG, CONSTANT.OTHER_PKG, 
        CONSTANT.CAN_PKG, CONSTANT.CONTAINER_PKG
    ];

    private readonly itemNames: string[] = [
        CONSTANT.FOOD_A, CONSTANT.DRY_A, CONSTANT.OTHER_A,
        CONSTANT.FOOD_B, CONSTANT.DRY_B, CONSTANT.OTHER_B,
        CONSTANT.FOOD_C, CONSTANT.DRY_C, CONSTANT.OTHER_C,
    ];

    private readonly foodItemNames: string[] = [ CONSTANT.FOOD_A, CONSTANT.FOOD_B, CONSTANT.FOOD_C];
    private readonly dryItemNames: string[] = [ CONSTANT.DRY_A, CONSTANT.DRY_B, CONSTANT.DRY_C];
    private readonly otherItemNames: string[] = [ CONSTANT.OTHER_A, CONSTANT.OTHER_B, CONSTANT.OTHER_C];

    private readonly measureNames: string[] = [
        UNIT_CONSTANT.GALLON, UNIT_CONSTANT.MILLILITER,
        UNIT_CONSTANT.PINT,   UNIT_CONSTANT.FL_OUNCE,
        UNIT_CONSTANT.LITER,  
        
        UNIT_CONSTANT.OUNCE, UNIT_CONSTANT.GRAM,
        UNIT_CONSTANT.POUND, UNIT_CONSTANT.KILOGRAM,

        UNIT_CONSTANT.UNIT, UNIT_CONSTANT.EACH,
    ];
    
    private initCategory = false;
    private initPackage = false;
    private initSize = false;
    private initVendor = false;
    private initItem = false;

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

        private readonly unitOfMeasureTestingUtil: UnitOfMeasureTestingUtil
    ){

     }

    /**
     * Dependencies: 
     * @returns 3 vendors, VendorA, B, and C
     */
    public async getTestInventoryItemVendorEntities(testContext: DatabaseTestContext): Promise<InventoryItemVendor[]> {
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
     * Dependencies: None
     * @returns 6 package types: bag, package, box, other, container, can
     */
    public async getTestInventoryItemPackageEntities(testContext: DatabaseTestContext): Promise<InventoryItemPackage[]> {
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
     * Dependencies: None
     * @returns 4 Categories, FOOD, OTHER, DRYGOOD, DAIRY
     */
    public async getTestInventoryItemCategoryEntities(testContext: DatabaseTestContext): Promise<InventoryItemCategory[]> {
        const results: InventoryItemCategory[] = [];
        for(const name of this.categoryNames){
            results.push(
                await this.categoryBuilder.reset()
                    .categoryName(name)
                    .build()
        )}
        return results;
    }

    /**
     * Dependencies: InventoryItemCategory, InventoryItemVendor
     * @returns 9 Inventory Items
     */
    public async getTestInventoryItemEntities(testContext: DatabaseTestContext): Promise<InventoryItem[]>{
        await this.initInventoryItemVendorTestDatabase(testContext);
        await this.initInventoryItemCategoryTestDatabase(testContext);
        
        const results: InventoryItem[] = [];
        for(let i = 0; i < this.foodItemNames.length; i++){
            results.push(
                await this.itemBuilder.reset()
                    .name(this.foodItemNames[i])
                    .categoryByName(CONSTANT.FOOD_CAT)
                    .vendorByName(this.vendorNames[i % this.vendorNames.length])
                    .build()
        )}
        for(let i = 0; i < this.dryItemNames.length; i++){
            results.push(
                await this.itemBuilder.reset()
                    .name(this.dryItemNames[i])
                    .categoryByName(CONSTANT.DRYGOOD_CAT)
                    .vendorByName(this.vendorNames[i % this.vendorNames.length])
                    .build()
        )}
        for(let i = 0; i < this.otherItemNames.length; i++){
            results.push(
                await this.itemBuilder.reset()
                    .name(this.otherItemNames[i])
                    .categoryByName(CONSTANT.OTHER_CAT)
                    .vendorByName(this.vendorNames[i % this.vendorNames.length])
                    .build()
        )}
        return results;
    }

    /**
     * Dependencies: InventoryItem, UnitOfMeasure, InventoryItemPackage
     * @returns 2 sizes for each inventory item (9 items)
     */
    public async getTestInventoryItemSizeEntities(testContext: DatabaseTestContext): Promise<InventoryItemSize[]> {
        await this.unitOfMeasureTestingUtil.initUnitOfMeasureTestDatabase(testContext);
        await this.initInventoryItemTestDatabase(testContext);
        await this.initInventoryItemPackageTestDatabase(testContext);

        const results: InventoryItemSize[] = [];
        let msrIdx = 0;
        let pkgIdx = 0; 
        for(let i = 0; i < this.itemNames.length; i++){
            results.push(
                await this.sizeBuilder.reset()
                    //.InventoryItemByName(this.itemNames[i])
                    .unitOfMeasureByName(this.measureNames[msrIdx++ % this.measureNames.length])
                    .packageByName(this.packageNames[pkgIdx++ % this.packageNames.length])
                    .build()
            );
            results.push(
                await this.sizeBuilder.reset()
                    //.InventoryItemByName(this.itemNames[i])
                    .unitOfMeasureByName(this.measureNames[msrIdx++ % this.measureNames.length])
                    .packageByName(this.packageNames[pkgIdx++ % this.packageNames.length])
                    .build()
            );
        }
        return results;
    }

    public async initInventoryItemVendorTestDatabase(testContext: DatabaseTestContext): Promise<void> {
        if(this.initVendor){ 
            return; 
        }
        this.initVendor = true;

        const vendors = await this.getTestInventoryItemVendorEntities(testContext);
        testContext.addCleanupFunction(() => this.cleanupInventoryItemVendorTestDatabase());

        /*const toInsert: InventoryItemVendor[] = [];
        for(const vendor of vendors){
            const exists = await this.vendorService.findOneByName(vendor.vendorName);
            if(!exists){ toInsert.push(vendor); }
        }*/
        await this.vendorService.insertEntities(/*toInsert*/vendors);
    }

    public async initInventoryItemPackageTestDatabase(testContext: DatabaseTestContext): Promise<void> {
        if(this.initPackage){ 
            return; 
        }
        this.initPackage = true;

        const defaultPackages = await this.getTestInventoryItemPackageEntities(testContext);
        testContext.addCleanupFunction(() => this.cleanupInventoryItemPackageTestDatabase());

        /*const toInsert: InventoryItemPackage[] = [];
        for(const packaging of defaultPackages){
            const exists = await this.packageService.findOneByName(packaging.packageName);
            if(!exists){ toInsert.push(packaging); }
        }*/
        await this.packageService.insertEntities(/*toInsert*/defaultPackages);
    }

    public async initInventoryItemCategoryTestDatabase(testContext: DatabaseTestContext): Promise<void> {
        if(this.initCategory){ 
            return; 
        }
        this.initCategory = true;

        const categories = await this.getTestInventoryItemCategoryEntities(testContext);
        testContext.addCleanupFunction(() => this.cleanupInventoryItemCategoryTestDatabase());

        for(const category of categories) {
            await this.categoryService.create(
                { itemCategoryName: category.categoryName } as CreateInventoryItemCategoryDto
        )}
    }

    public async initInventoryItemTestDatabase(testContext: DatabaseTestContext): Promise<void> {
        if(this.initItem){ 
            return; 
        }
        this.initItem = true;

        const items = await this.getTestInventoryItemEntities(testContext);
        testContext.addCleanupFunction(() => this.cleanupInventoryItemTestDatabase());
        
        for(const item of items){
            /*const exists = await this.itemService.findOneByName(item.itemName);
            if(exists){ continue; }*/

            await this.itemService.create({
                itemName: item.itemName,
                inventoryItemCategoryId: item.category?.id,
                vendorId: item.vendor?.id,
            } as CreateInventoryItemDto);
        };
    }

    public async initInventoryItemSizeTestDatabase(testContext: DatabaseTestContext): Promise<void> {
        if(this.initSize){ 
            return; 
        }
        this.initSize = true;

        const testingSizes = await this.getTestInventoryItemSizeEntities(testContext);
        let sizeIdx = 0;

        const itemsRequest = await this.itemService.findAll();
        const items = itemsRequest.items;

        testContext.addCleanupFunction(() => this.cleanupInventoryItemSizeTestDatabase());
        for(const item of items){
            const dto1 = testingSizes[sizeIdx++ % testingSizes.length];
            const dto2 = testingSizes[sizeIdx++ % testingSizes.length];

            await this.itemService.update(item.id, {
                itemSizeDtos: [
                    {
                        mode: 'create',
                        measureUnitId: dto1.measureUnit.id,
                        measureAmount: 1,
                        inventoryPackageId: dto1.packageType.id,
                        cost: 1,
                    } as CreateChildInventoryItemSizeDto,
                    {
                        mode: 'create',
                        measureUnitId: dto2.measureUnit.id,
                        measureAmount: 1,
                        inventoryPackageId: dto2.packageType.id,
                        cost: 1,
                    } as CreateChildInventoryItemSizeDto
                ]
            } as UpdateInventoryItemDto);
        }
        /*for(const size of testingSizes){
            await this.sizeService.create({
                    measureUnitId: size.measureUnit.id,
                    inventoryPackageId: size.packageType.id,
                    inventoryItemId: size.inventoryItem.id,
                    cost: 1,
                    measureAmount: 1,
                } as CreateInventoryItemSizeDto 
        )}*/

        // updateInventoryItem
    }

    public async cleanupInventoryItemVendorTestDatabase(): Promise<void> {
        await this.vendorService.getQueryBuilder().delete().execute();
    }

    public async cleanupInventoryItemPackageTestDatabase(): Promise<void> {
        await this.packageService.getQueryBuilder().delete().execute();
    }

    public async cleanupInventoryItemCategoryTestDatabase(): Promise<void> {
        await this.categoryService.getQueryBuilder().delete().execute();
    }

    public async cleanupInventoryItemSizeTestDatabase(): Promise<void> {
        await this.sizeService.getQueryBuilder().delete().execute();
    }

    public async cleanupInventoryItemTestDatabase(): Promise<void> {
        await this.itemService.getQueryBuilder().delete().execute();
    }

    /**
     * - Create's inventoryItemSize dtos for create method of an inventory item
     */
    public createChildInventoryItemSizeDtos(resultAmount: number, packageIds: number[], unitIds: number[], costs: number[]): CreateChildInventoryItemSizeDto[] {
        const results: CreateChildInventoryItemSizeDto[] = [];
        
        let packageIdx = 0;
        let costIdx = 0;
        let unitIdx = 0;

        let packageIter = 0;
        let costIter = 0;

        for(let i = 0; i < resultAmount; i++){
            results.push(
                {
                    mode: 'create',
                    measureUnitId: unitIds[unitIdx++],
                    inventoryPackageId: packageIds[packageIdx++],
                    cost: costs[costIter++],
                    measureAmount: 1
                } as CreateChildInventoryItemSizeDto
            )
            if(unitIdx === unitIds.length){
                unitIdx = 0;
            }
            if(packageIdx === packageIds.length){
                packageIter++;
                packageIdx = packageIter;
            }
            if(costIdx === costs.length){
                costIter++;
                costIdx = costIter;
            }
        }
        return results;
    }   
}