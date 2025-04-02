import { Injectable } from "@nestjs/common";
import { EntityFactory } from "../../../base/entity-factory";
import { CreateDefaultInventoryAreaDtoValues, CreateInventoryAreaDto } from "../dto/create-inventory-area.dto";
import { UpdateInventoryAreaDto } from "../dto/update-inventory-area.dto";
import { InventoryArea } from "../entities/inventory-area.entity";
import { AREA_A, AREA_B, AREA_C, AREA_D, } from "../utils/constants";

@Injectable()
export class InventoryAreaFactory extends EntityFactory<InventoryArea, CreateInventoryAreaDto, UpdateInventoryAreaDto>{
    constructor(){
        super(InventoryArea, CreateInventoryAreaDto, UpdateInventoryAreaDto, CreateDefaultInventoryAreaDtoValues()); 
    }

    getTestingAreas(): InventoryArea[] {
        return [
            this.createEntityInstance({ name: AREA_A }),
            this.createEntityInstance({ name: AREA_B }),
            this.createEntityInstance({ name: AREA_C }),
            this.createEntityInstance({ name: AREA_D }),
        ];
    }
}