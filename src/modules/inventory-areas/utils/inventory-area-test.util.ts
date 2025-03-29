import { forwardRef, Inject, Injectable, NotImplementedException } from "@nestjs/common";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { InventoryAreaCountBuilder } from "../builders/inventory-area-count.builder";
import { InventoryAreaItemCountBuilder } from "../builders/inventory-area-item-count.builder";
import { InventoryAreaBuilder } from "../builders/inventory-area.builder";
import { CreateInventoryAreaCountDto } from "../dto/create-inventory-area-count.dto";
import { CreateInventoryAreaItemCountDto } from "../dto/create-inventory-area-item-count.dto";
import { CreateInventoryAreaDto } from "../dto/create-inventory-area.dto";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryAreaItemCount } from "../entities/inventory-area-item-count.entity";
import { InventoryArea } from "../entities/inventory-area.entity";
import { InventoryAreaCountService } from "../services/inventory-area-count.service";
import { InventoryAreaItemCountService } from "../services/inventory-area-item-count.service";
import { InventoryAreaService } from "../services/inventory-area.service";
import { AREA_A, AREA_B, AREA_C, AREA_D } from "./constants";

@Injectable()
export class InventoryAreaTestUtil {

    private readonly areaNames = [ AREA_A, AREA_B, AREA_C, AREA_D];

    constructor(

        private readonly areaService: InventoryAreaService,
        private readonly areaBuilder: InventoryAreaBuilder,

        private readonly countService: InventoryAreaCountService,
        private readonly areaCountBuilder: InventoryAreaCountBuilder,

        private readonly itemCountService: InventoryAreaItemCountService,
        private readonly itemCountBuilder: InventoryAreaItemCountBuilder,
        
        private readonly inventoryItemService: InventoryItemService,
    ){}

    /**
     * 
     * @returns 4 Inventory areas, Area_A, B, C, and D
     */
    public async getTestInventoryAreaEntities(): Promise<InventoryArea[]> { 
        const results: InventoryArea[] = [];
        for(const name of this.areaNames){
            results.push(
                await this.areaBuilder.reset()
                    .name(name)
                    .build()
            )
        }
        return results;
    }

    /**
     * 
     * @returns 6 InventoryAreaCount entites (0 for area_a, 1 for area_b, 2 for area_c, 3 for area_d), 
     * no Ids, ready to be inserted into DB
     */
    public async getTestInventoryAreaCountEntities(): Promise<InventoryAreaCount[]> {
        return [
            await this.areaCountBuilder.reset()
                .inventoryAreaByName(AREA_B)
                .build(),

            await this.areaCountBuilder.reset()
                .inventoryAreaByName(AREA_C)
                .build(),
            await this.areaCountBuilder.reset()
                .inventoryAreaByName(AREA_C)
                .build(),

            await this.areaCountBuilder.reset()
                .inventoryAreaByName(AREA_D)
                .build(),
            await this.areaCountBuilder.reset()
                .inventoryAreaByName(AREA_D)
                .build(),
            await this.areaCountBuilder.reset()
                .inventoryAreaByName(AREA_D)
                .build(),
        ];
    }

    /**
     * 
     * @returns 12 items counts, 2 items for each test count, 1 for area B, 2 for area C, 3 for area D
     */
    public async getTestInventoryAreaItemCountEntities(): Promise<InventoryAreaItemCount[]> {
        const results: InventoryAreaItemCount[] = [];
        const counts = await this.countService.findAll(["inventoryArea"]);
        const items = await this.inventoryItemService.findAll(["sizes"]);
        let itemPtr = 0;

        for(let i = 0; i < counts.length; i++){
            const itemA = items[itemPtr++ % items.length];
            if(!itemA.sizes){ throw new Error("itemA sizes null"); }
            const sizeA = itemA.sizes[0];
            results.push(
                await this.itemCountBuilder.reset()
                .inventoryAreaById(counts[i].inventoryArea.id)
                .areaCountById(counts[i].id)
                .inventoryItemById(itemA.id)
                .sizesById(sizeA.id)
                .unitAmount(1)
                .measureAmount(1)
                .build()
            );

            const itemB = items[itemPtr++ % items.length];
            if(!itemB.sizes){ throw new Error("itemA sizes null"); }
            const sizeB = itemB.sizes[0];
            results.push(
                await this.itemCountBuilder.reset()
                .inventoryAreaById(counts[i].inventoryArea.id)
                .areaCountById(counts[i].id)
                .inventoryItemById(itemB.id)
                .sizesById(sizeB.id)
                .unitAmount(1)
                .measureAmount(1)
                .build()
            );
        }
        return results;
    }
    
    public async initializeInventoryAreaDatabaseTesting(): Promise<void> {
        const areas = await this.getTestInventoryAreaEntities();
        for(const area of areas){
            await this.areaService.create(
                { name: area.name } as CreateInventoryAreaDto
            )
        }
    }

    public async initializeInventoryAreaCountTestingDataBase(): Promise<void> {
        const counts = await this.getTestInventoryAreaCountEntities();
        for(const count of counts){
            await this.countService.create(
                { inventoryAreaId: count.inventoryArea.id, } as CreateInventoryAreaCountDto
            )
        }
    }

    public async initializeInventoryAreaItemCountTestingDataBase(): Promise<void> {
        const countedItems = await this.getTestInventoryAreaItemCountEntities();
        for(const countedItem of countedItems){
            await this.itemCountService.create(
                {
                    inventoryAreaId: countedItem.inventoryArea.id,
                    areaCountId: countedItem.areaCount.id,
                    inventoryItemId: countedItem.item.id,
                    unitAmount: countedItem.unitAmount,
                    measureAmount: countedItem.measureAmount,
                    itemSizeId: countedItem.size.id,
                } as CreateInventoryAreaItemCountDto
            )
        }
    }
}