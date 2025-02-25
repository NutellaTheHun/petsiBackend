import { Injectable } from "@nestjs/common";
import { EntityFactory } from "../../../base/entity-factory";
import { CreateDefaultInventoryItemDtoValues, CreateInventoryItemDto } from "../dto/create-inventory-item.dto";
import { UpdateInventoryItemDto } from "../dto/update-inventory-item.dto";
import { InventoryItemCategory } from "../entities/inventory-item-category.entity";

@Injectable()
export class InventoryItemCategoryFactory extends EntityFactory<InventoryItemCategory, CreateInventoryItemDto, UpdateInventoryItemDto>{

    constructor() {
        super( InventoryItemCategory, CreateInventoryItemDto, UpdateInventoryItemDto, CreateDefaultInventoryItemDtoValues());
    }

    getDefaultRoles(): InventoryItemCategory[] {
        return [

        ];
    }

    getTestingRoles(): InventoryItemCategory[]{
        return this.getDefaultRoles();
    }  
}