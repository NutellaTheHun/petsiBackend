import { Injectable } from "@nestjs/common";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryArea } from "../entities/inventory-area.entity";

@Injectable()
export class InventoryAreaFactory {
    createInventoryAreaInstance(name: string, inventoryCounts: InventoryAreaCount[]){
        return {name: name, inventoryCounts: inventoryCounts} as InventoryArea;
    }

    createDtoToEntity
}