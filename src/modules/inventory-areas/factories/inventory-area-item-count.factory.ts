import { Injectable } from "@nestjs/common";
import { EntityFactory } from "../../../base/entity-factory";
import { InventoryAreaItemCount } from "../entities/inventory-area-item-count.entity";
import { CreateDefaultInventoryAreaItemCountDtoValues, CreateInventoryAreaItemCountDto } from "../dto/create-inventory-area-item-count.dto";
import { UpdateInventoryAreaItemCountDto } from "../dto/update-inventory-area-item-count.dto";

@Injectable()
export class InventoryAreaItemCountFactory extends EntityFactory<InventoryAreaItemCount, CreateInventoryAreaItemCountDto, UpdateInventoryAreaItemCountDto>{
    constructor(){
        super(InventoryAreaItemCount, CreateInventoryAreaItemCountDto, UpdateInventoryAreaItemCountDto, CreateDefaultInventoryAreaItemCountDtoValues()); 
    }
}