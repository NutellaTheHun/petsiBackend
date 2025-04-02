import { Injectable } from "@nestjs/common";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { InventoryAreaCountBuilder } from "../builders/inventory-area-count.builder";
import { InventoryAreaItemCountBuilder } from "../builders/inventory-area-item-count.builder";
import { InventoryAreaBuilder } from "../builders/inventory-area.builder";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryAreaItemCount } from "../entities/inventory-area-item-count.entity";
import { InventoryArea } from "../entities/inventory-area.entity";
import { InventoryAreaCountService } from "../services/inventory-area-count.service";
import { InventoryAreaItemCountService } from "../services/inventory-area-item-count.service";
import { InventoryAreaService } from "../services/inventory-area.service";
import { AREA_A, AREA_B, AREA_C, AREA_D } from "./constants";
import { InventoryItemTestingUtil } from "../../inventory-items/utils/inventory-item-testing.util";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";

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

        private readonly inventoryItemTestUtil: InventoryItemTestingUtil,
    ){}

    /**
     * Dependencies: None
     * @returns 4 Inventory areas, Area_A, B, C, and D
     */
    public async getTestInventoryAreaEntities(testContext: DatabaseTestContext): Promise<InventoryArea[]> { 
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
     * Dependencies: InventoryArea
     * @returns 6 InventoryAreaCount entites (0 for area_a, 1 for area_b, 2 for area_c, 3 for area_d), 
     * no Ids, ready to be inserted into DB
     */
    public async getTestInventoryAreaCountEntities(testContext: DatabaseTestContext): Promise<InventoryAreaCount[]> {
        await this.initInventoryAreaTestDatabase(testContext);

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
     * Dependencies: InventoryArea, InventoryAreaCount, InventoryItem, InventoryItemSize
     * @returns 12 items counts, 2 items for each test count, 1 for area B, 2 for area C, 3 for area D
     */
    public async getTestInventoryAreaItemCountEntities(testContext: DatabaseTestContext): Promise<InventoryAreaItemCount[]> {
        await this.initInventoryAreaCountTestDatabase(testContext);
        await this.inventoryItemTestUtil.initInventoryItemSizeTestDatabase(testContext);

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
    
    public async initInventoryAreaTestDatabase(testContext: DatabaseTestContext): Promise<void> {
        const areas = await this.getTestInventoryAreaEntities(testContext);
        testContext.addCleanupFunction(() => this.cleanupInventoryAreaTestDatabase());
        const toInsert: InventoryArea[] = [];

        for(const area of areas){
            const exists = await this.areaService.findOneByName(area.name);
            if(!exists){ toInsert.push(area); }
        }
        await this.areaService.insertEntities(toInsert);
        // register cleanup
    }

    public async initInventoryAreaCountTestDatabase(testContext: DatabaseTestContext): Promise<void> {
        testContext.addCleanupFunction(() => this.cleanupInventoryAreaCountTestDatabase());
        await this.countService.insertEntities(
            await this.getTestInventoryAreaCountEntities(testContext)
        );
    }

    public async initInventoryAreaItemCountTestDatabase(testContext: DatabaseTestContext): Promise<void> {
        testContext.addCleanupFunction(() => this.cleanupInventoryAreaItemCountTestDatabase());
        await this.itemCountService.insertEntities(
            await this.getTestInventoryAreaItemCountEntities(testContext)
        );
    }

    public async cleanupInventoryAreaTestDatabase(): Promise<void> {
        await this.areaService.getQueryBuilder().delete().execute();
    }

    public async cleanupInventoryAreaCountTestDatabase(): Promise<void> {
        await this.countService.getQueryBuilder().delete().execute();
    }

    public async cleanupInventoryAreaItemCountTestDatabase(): Promise<void> {
        await this.itemCountService.getQueryBuilder().delete().execute();
    }
}