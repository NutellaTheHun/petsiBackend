import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { EntityFactory } from "../../../base/entity-factory";
import { InventoryItemSize } from "../entities/inventory-item-size.entity";
import { CreateDefaultInventoryItemSizeDtoValues, CreateInventoryItemSizeDto } from "../dto/create-inventory-item-size.dto";
import { UpdateInventoryItemSizeDto } from "../dto/update-inventory-item-size.dto";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { InventoryItemPackageService } from "../services/inventory-item-package.service";
import { InventoryItemService } from "../services/inventory-item.service";
import { BAG_PKG, BOX_PKG, CAN_PKG, CONTAINER_PKG, DRY_A, DRY_B, DRY_C, FOOD_A, FOOD_B, FOOD_C, OTHER_A, OTHER_B, OTHER_C, OTHER_PKG, PACKAGE_PKG } from "../utils/constants";
import { EACH, FL_OUNCE, GALLON, GRAM, KILOGRAM, LITER, MILLILITER, OUNCE, PINT, POUND, UNIT } from "../../unit-of-measure/utils/constants";

@Injectable()
export class InventoryItemSizeFactory extends EntityFactory<InventoryItemSize, CreateInventoryItemSizeDto, UpdateInventoryItemSizeDto>{

    constructor(
        @Inject(forwardRef(() => InventoryItemService))
        private readonly itemService: InventoryItemService,
        
        private readonly packageService: InventoryItemPackageService,
        private readonly unitService: UnitOfMeasureService,
    ) {
        super( InventoryItemSize, CreateInventoryItemSizeDto, UpdateInventoryItemSizeDto, CreateDefaultInventoryItemSizeDtoValues());
    }

    // measureUnit: UnitOfMeasure
    // packageType: InventoryItemPackage
    // item: InventoryItem
    getDefaultItemSizes(): InventoryItemSize[] {
        return [
            
        ];
    }
    
    /**
     *  Depends on UnitOfMeasureService, InventoryItemPackageService, InventoryItemService
     */ 
    async getTestingItemSizes(): Promise<InventoryItemSize[]>{
        return [
            this.createEntityInstance({
                measureUnit: await this.unitService.findOneByName(POUND),
                packageType: await this.packageService.findOneByName(BOX_PKG),
                item: await this.itemService.findOneByName(FOOD_A),
             }),
             
            this.createEntityInstance({
                measureUnit: await this.unitService.findOneByName(GALLON),
                packageType: await this.packageService.findOneByName(CONTAINER_PKG),
                item: await this.itemService.findOneByName(FOOD_A),
             }),

            this.createEntityInstance({
                measureUnit: await this.unitService.findOneByName(KILOGRAM),
                packageType: await this.packageService.findOneByName(PACKAGE_PKG),
                item: await this.itemService.findOneByName(FOOD_B),
             }),

            this.createEntityInstance({
                measureUnit: await this.unitService.findOneByName(UNIT),
                packageType: await this.packageService.findOneByName(OTHER_PKG),
                item: await this.itemService.findOneByName(FOOD_B),
             }),

            this.createEntityInstance({
                measureUnit: await this.unitService.findOneByName(LITER),
                packageType: await this.packageService.findOneByName(CONTAINER_PKG),
                item: await this.itemService.findOneByName(FOOD_C),
             }),

            this.createEntityInstance({
                measureUnit: await this.unitService.findOneByName(MILLILITER),
                packageType: await this.packageService.findOneByName(OTHER_PKG),
                item: await this.itemService.findOneByName(FOOD_C),
             }),

            this.createEntityInstance({
                measureUnit: await this.unitService.findOneByName(OUNCE),
                packageType: await this.packageService.findOneByName(BOX_PKG),
                item: await this.itemService.findOneByName(DRY_A),
             }),

            this.createEntityInstance({
                measureUnit: await this.unitService.findOneByName(GRAM),
                packageType: await this.packageService.findOneByName(CONTAINER_PKG),
                item: await this.itemService.findOneByName(DRY_A),
             }),

            this.createEntityInstance({
                measureUnit: await this.unitService.findOneByName(EACH),
                packageType: await this.packageService.findOneByName(OTHER_PKG),
                item: await this.itemService.findOneByName(DRY_B),
             }),

            this.createEntityInstance({
                measureUnit: await this.unitService.findOneByName(POUND),
                packageType: await this.packageService.findOneByName(BAG_PKG),
                item: await this.itemService.findOneByName(DRY_B),
             }),


            this.createEntityInstance({
                measureUnit: await this.unitService.findOneByName(KILOGRAM),
                packageType: await this.packageService.findOneByName(CAN_PKG),
                item: await this.itemService.findOneByName(DRY_C),
             }),

            this.createEntityInstance({
                measureUnit: await this.unitService.findOneByName(UNIT),
                packageType: await this.packageService.findOneByName(BAG_PKG),
                item: await this.itemService.findOneByName(DRY_C),
             }),

            this.createEntityInstance({
                measureUnit: await this.unitService.findOneByName(FL_OUNCE),
                packageType: await this.packageService.findOneByName(BOX_PKG),
                item: await this.itemService.findOneByName(OTHER_A),
             }),

            this.createEntityInstance({
                measureUnit: await this.unitService.findOneByName(GRAM),
                packageType: await this.packageService.findOneByName(BAG_PKG),
                item: await this.itemService.findOneByName(OTHER_B),
             }),

            this.createEntityInstance({
                measureUnit: await this.unitService.findOneByName(PINT),
                packageType: await this.packageService.findOneByName(CONTAINER_PKG),
                item: await this.itemService.findOneByName(OTHER_C),
             }),
        ];
    }  
}