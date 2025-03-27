import { Injectable } from "@nestjs/common";
import { InventoryItemSizeService } from "../../inventory-items/services/inventory-item-size.service";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { CreateInventoryAreaCountDto } from "../dto/create-inventory-area-count.dto";
import { CreateInventoryAreaDto } from "../dto/create-inventory-area.dto";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryArea } from "../entities/inventory-area.entity";
import { InventoryAreaCountService } from "../services/inventory-area-count.service";
import { InventoryAreaItemCountService } from "../services/inventory-area-item-count.service";
import { InventoryAreaService } from "../services/inventory-area.service";
import { AREA_A, AREA_B, AREA_C, AREA_D } from "./constants";
import * as ITEM_CONSTANT from "../../inventory-items/utils/constants";
import { InventoryAreaItemCount } from "../entities/inventory-area-item-count.entity";
import { CreateInventoryAreaItemCountDto } from "../dto/create-inventory-area-item-count.dto";

@Injectable()
export class InventoryAreaTestUtil {
    constructor(
        private readonly areaService: InventoryAreaService,
        private readonly countService: InventoryAreaCountService,
        private readonly itemCountService: InventoryAreaItemCountService,

        private readonly inventoryItemService: InventoryItemService,
    ){}

    public getTestInventoryAreaEntities(): InventoryArea[]{ 
        return[
            { name: AREA_A } as InventoryArea,
            { name: AREA_B } as InventoryArea,
            { name: AREA_C } as InventoryArea,
            { name: AREA_D } as InventoryArea,
        ];
    }

    public async initializeInventoryAreaDatabaseTesting(): Promise<void> {
        const areas = this.getTestInventoryAreaEntities();
        for(const area of areas){
            await this.areaService.create(
                { name: area.name } as CreateInventoryAreaDto
            )
        }
    }

    /**
     * 
     * @returns 6 InventoryAreaCount entites (0 for area_a, 1 for area_b, 2 for area_c, 3 for area_d), 
     * no Ids, ready to be inserted into DB
     */
    public async getTestInventoryAreaCountEntities(): Promise<InventoryAreaCount[]> {
        const areaB = await this.areaService.findOneByName(AREA_B);
        if(!areaB){
            throw new Error("area b not found");
        }
        const areaC = await this.areaService.findOneByName(AREA_B);
        if(!areaC){
            throw new Error("area C not found");
        }
        const areaD = await this.areaService.findOneByName(AREA_B);
        if(!areaD){
            throw new Error("area D not found");
        }
        return [
            { inventoryArea: areaB, } as InventoryAreaCount,
            { inventoryArea: areaC, } as InventoryAreaCount,
            { inventoryArea: areaC, } as InventoryAreaCount,
            { inventoryArea: areaD, } as InventoryAreaCount,
            { inventoryArea: areaD, } as InventoryAreaCount,
            { inventoryArea: areaD, } as InventoryAreaCount,
        ];
    }

    public async initializeInventoryAreaCountTestingDataBase(): Promise<void> {
        const counts = await this.getTestInventoryAreaCountEntities();
        for(const count of counts){
            await this.countService.create(
                { inventoryAreaId: count.inventoryArea.id, } as CreateInventoryAreaCountDto
            )
        }
    }

    public async getTestInventoryAreaItemCountEntities(): Promise<InventoryAreaItemCount[]> {
        // 6 inventory counts to populate
        const counts = await this.countService.findAll(["inventoryArea"]);
        if(!counts){
            throw new Error("inventory area counts not found");
        }

        // items with sizing, 2 sizes each: 
        const foodA = await this.inventoryItemService.findOneByName(ITEM_CONSTANT.FOOD_A, ["sizes"])
        if(!foodA?.sizes){ throw new Error("foodA sizes is null"); }
        const foodB = await this.inventoryItemService.findOneByName(ITEM_CONSTANT.FOOD_B, ["sizes"])
        if(!foodB?.sizes){ throw new Error("foodB sizes is null"); }
        const foodC = await this.inventoryItemService.findOneByName(ITEM_CONSTANT.FOOD_C, ["sizes"])
        if(!foodC?.sizes){ throw new Error("foodC sizes is null"); }

        const dryA = await this.inventoryItemService.findOneByName(ITEM_CONSTANT.DRY_A, ["sizes"])
        if(!dryA?.sizes){ throw new Error("dryA sizes is null"); }
        const dryB = await this.inventoryItemService.findOneByName(ITEM_CONSTANT.DRY_B, ["sizes"])
        if(!dryB?.sizes){ throw new Error("dryB sizes is null"); }
        const dryC = await this.inventoryItemService.findOneByName(ITEM_CONSTANT.DRY_C, ["sizes"])
        if(!dryC?.sizes){ throw new Error("dryC sizes is null"); }

        const otherA = await this.inventoryItemService.findOneByName(ITEM_CONSTANT.OTHER_A, ["sizes"])
        if(!otherA?.sizes){ throw new Error("otherA sizes is null"); }
        const otherB = await this.inventoryItemService.findOneByName(ITEM_CONSTANT.OTHER_B, ["sizes"])
        if(!otherB?.sizes){ throw new Error("otherB sizes is null"); }
        const otherC = await this.inventoryItemService.findOneByName(ITEM_CONSTANT.OTHER_C, ["sizes"])
        if(!otherC?.sizes){ throw new Error("otherC sizes is null"); }

        return [
            {
                inventoryArea: counts[0].inventoryArea, // AreaB
                areaCount: counts[0],
                item: foodB,
                unitAmount: 1,
                measureAmount: 1,
                size: foodB?.sizes[0],
            } as InventoryAreaItemCount,

            {
                inventoryArea: counts[1].inventoryArea, // AreaC
                areaCount: counts[1],
                item: foodC,
                unitAmount: 2,
                measureAmount: 2,
                size: foodC.sizes[0],
            } as InventoryAreaItemCount,
            {
                inventoryArea: counts[1].inventoryArea, // AreaC
                areaCount: counts[1],
                item: dryC,
                unitAmount: 1,
                measureAmount: 1,
                size: dryC.sizes[0],
            } as InventoryAreaItemCount,
            {
                inventoryArea: counts[2].inventoryArea, // AreaC
                areaCount: counts[2],
                item: otherC,
                unitAmount: 2,
                measureAmount: 2,
                size: otherC.sizes[0],
            } as InventoryAreaItemCount,
            {
                inventoryArea: counts[2].inventoryArea, // AreaC
                areaCount: counts[2],
                item: foodC,
                unitAmount: 3,
                measureAmount: 3,
                size: foodC.sizes[1],
            } as InventoryAreaItemCount,
            {
                inventoryArea: counts[3].inventoryArea, // AreaD
                areaCount: counts[3],
                item: otherA,
                unitAmount: 1,
                measureAmount: 1,
                size: otherA.sizes[1],
            } as InventoryAreaItemCount,
            {
                inventoryArea: counts[3].inventoryArea, // AreaD
                areaCount: counts[3],
                item: dryC,
                unitAmount: 1,
                measureAmount: 1,
                size: dryC.sizes[1],
            } as InventoryAreaItemCount,
            {
                inventoryArea: counts[3].inventoryArea, // AreaD
                areaCount: counts[3],
                item: foodB,
                unitAmount: 1,
                measureAmount: 1,
                size: foodB.sizes[1],
            } as InventoryAreaItemCount,
            {
                inventoryArea: counts[4].inventoryArea, // AreaD
                areaCount: counts[4],
                item: foodA,
                unitAmount: 1,
                measureAmount: 1,
                size: foodA.sizes[1],
            } as InventoryAreaItemCount,
            {
                inventoryArea: counts[5].inventoryArea, // AreaD
                areaCount: counts[5],
                item: dryB,
                unitAmount: 1,
                measureAmount: 1,
                size: dryB.sizes[1],
            } as InventoryAreaItemCount,
            {
                inventoryArea: counts[5].inventoryArea, // AreaD
                areaCount: counts[5],
                item: otherB,
                unitAmount: 1,
                measureAmount: 1,
                size: otherB.sizes[1],
            } as InventoryAreaItemCount,
        ]
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