import { Injectable } from "@nestjs/common";
import { EntityFactory } from "../../../base/entity-factory";
import { CreateDefaultInventoryItemDtoValues, CreateInventoryItemDto } from "../dto/create-inventory-item.dto";
import { UpdateInventoryItemDto } from "../dto/update-inventory-item.dto";
import { InventoryItemCategory } from "../entities/inventory-item-category.entity";
import { CreateInventoryItemCategoryDto } from "../dto/create-inventory-item-category.dto";
import { UpdateInventoryItemCategoryDto } from "../dto/update-inventory-item-category.dto";

@Injectable()
export class InventoryItemCategoryFactory extends EntityFactory<InventoryItemCategory, CreateInventoryItemCategoryDto, UpdateInventoryItemCategoryDto>{

    constructor() {
        super( InventoryItemCategory, CreateInventoryItemCategoryDto, UpdateInventoryItemCategoryDto, CreateDefaultInventoryItemDtoValues());
    }

    getDefaultItemCategories(): InventoryItemCategory[] {
        return [
            this.createEntityInstance({ name: "cleaning" }),
            this.createEntityInstance({ name: "dairy" }),
            this.createEntityInstance({ name: "dry goods" }),
            this.createEntityInstance({ name: "food" }),
            this.createEntityInstance({ name: "frozen" }),
            this.createEntityInstance({ name: "other" }),
            this.createEntityInstance({ name: "paper goods" }),
            this.createEntityInstance({ name: "produce" }),
        ];
    }

    getTestingItemCategories(): InventoryItemCategory[]{
        return this.getDefaultItemCategories();
    }  
}