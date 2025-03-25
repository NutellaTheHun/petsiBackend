import { Injectable } from "@nestjs/common";
import { EntityFactory } from "../../../base/entity-factory";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { CreateDefaultInventoryAreaCountDtoValues, CreateInventoryAreaCountDto } from "../dto/create-inventory-area-count.dto";
import { UpdateInventoryAreaCountDto } from "../dto/update-inventory-area-count.dto";

@Injectable()
export class InventoryAreaCountFactory extends EntityFactory<InventoryAreaCount, CreateInventoryAreaCountDto, UpdateInventoryAreaCountDto>{
    constructor(){
        super(InventoryAreaCount, CreateInventoryAreaCountDto, UpdateInventoryAreaCountDto, CreateDefaultInventoryAreaCountDtoValues()); 
    }
}