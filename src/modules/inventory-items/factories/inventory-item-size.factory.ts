import { Injectable } from "@nestjs/common";
import { EntityFactory } from "../../../base/entity-factory";
import { InventoryItemSize } from "../entities/inventory-item-size.entity";
import { CreateDefaultInventoryItemSizeDtoValues, CreateInventoryItemSizeDto } from "../dto/create-inventory-item-size.dto";
import { UpdateInventoryItemSizeDto } from "../dto/update-inventory-item-size.dto";

@Injectable()
export class InventoryItemSizeFactory extends EntityFactory<InventoryItemSize, CreateInventoryItemSizeDto, UpdateInventoryItemSizeDto>{

    constructor() {
        super( InventoryItemSize, CreateInventoryItemSizeDto, UpdateInventoryItemSizeDto, CreateDefaultInventoryItemSizeDtoValues());
    }

    // measureUnit: UnitOfMeasure
    // packageType: InventoryItemPackage
    // item: InventoryItem
    getDefaultRoles(): InventoryItemSize[] {
        return [
            
        ];
    }

    getTestingRoles(): InventoryItemSize[]{
        return this.getDefaultRoles();
    }  
}