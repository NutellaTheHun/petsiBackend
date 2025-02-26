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
            this.createEntityInstance({name: "cleaning"}),
            this.createEntityInstance({name: "dairy"}),
            this.createEntityInstance({name: "dry goods"}),
            this.createEntityInstance({name: "food"}),
            this.createEntityInstance({name: "frozen"}),
            this.createEntityInstance({name: "other"}),
            this.createEntityInstance({name: "papger goods"}),
            this.createEntityInstance({name: "produce"}),
        ];
    }

    getTestingRoles(): InventoryItemCategory[]{
        return this.getDefaultRoles();
    }  
}