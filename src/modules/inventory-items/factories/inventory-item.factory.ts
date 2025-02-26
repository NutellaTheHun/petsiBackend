import { Injectable } from "@nestjs/common";
import { EntityFactory } from "../../../base/entity-factory";
import { InventoryItem } from "../entities/inventory-item.entity";
import { CreateDefaultInventoryItemDtoValues, CreateInventoryItemDto } from "../dto/create-inventory-item.dto";
import { UpdateInventoryItemDto } from "../dto/update-inventory-item.dto";

@Injectable()
export class InventoryItemFactory extends EntityFactory<InventoryItem, CreateInventoryItemDto, UpdateInventoryItemDto>{

    constructor() {
        super( InventoryItem, CreateInventoryItemDto, UpdateInventoryItemDto, CreateDefaultInventoryItemDtoValues());
    }

    getDefaultRoles(): InventoryItem[] {
        return [

        ];
    }
    
    // name
    // category?: InventoryItemCategory
    // sizes: InventoryItemSize[]
    // vendor?: InventoryItemVendor
    getTestingRoles(): InventoryItem[]{
        return [

        ];
    }  
}