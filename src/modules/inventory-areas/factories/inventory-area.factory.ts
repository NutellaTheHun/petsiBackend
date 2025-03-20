import { Injectable } from "@nestjs/common";
import { EntityFactory } from "../../../base/entity-factory";
import { CreateDefaultInventoryAreaDtoValues, CreateInventoryAreaDto } from "../dto/create-inventory-area.dto";
import { UpdateInventoryAreaDto } from "../dto/update-inventory-area.dto";
import { InventoryArea } from "../entities/inventory-area.entity";

@Injectable()
export class InventoryAreaFactory extends EntityFactory<InventoryArea, CreateInventoryAreaDto, UpdateInventoryAreaDto>{
    constructor(){
        super(InventoryArea, CreateInventoryAreaDto, UpdateInventoryAreaDto, CreateDefaultInventoryAreaDtoValues()); 
    }
}