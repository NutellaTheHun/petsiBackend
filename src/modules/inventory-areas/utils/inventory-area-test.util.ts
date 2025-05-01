import { Injectable } from "@nestjs/common";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateInventoryItemSizeDto } from "../../inventory-items/dto/create-inventory-item-size.dto";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { InventoryItemTestingUtil } from "../../inventory-items/utils/inventory-item-testing.util";
import { InventoryAreaCountBuilder } from "../builders/inventory-area-count.builder";
import { InventoryAreaItemBuilder } from "../builders/inventory-area-item.builder";
import { InventoryAreaBuilder } from "../builders/inventory-area.builder";
import { CreateInventoryAreaItemDto } from "../dto/create-inventory-area-item.dto";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryAreaItem } from "../entities/inventory-area-item.entity";
import { InventoryArea } from "../entities/inventory-area.entity";
import { InventoryAreaCountService } from "../services/inventory-area-count.service";
import { InventoryAreaItemService } from "../services/inventory-area-item.service";
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

        private readonly itemCountService: InventoryAreaItemService,
        private readonly itemCountBuilder: InventoryAreaItemBuilder,
        
        private readonly inventoryItemService: InventoryItemService,

        private readonly inventoryItemTestUtil: InventoryItemTestingUtil,
    ){}

    /**
     * Dependencies initialized: None
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
     * Dependencies initialized: InventoryArea
     * @returns 7 InventoryAreaCount entites (1 for area_a, 1 for area_b, 2 for area_c, 3 for area_d), 
     * no Ids, ready to be inserted into DB
     */
    public async getTestInventoryAreaCountEntities(testContext: DatabaseTestContext): Promise<InventoryAreaCount[]> {
        await this.initInventoryAreaTestDatabase(testContext);

        return [
            await this.areaCountBuilder.reset()
            .inventoryAreaByName(AREA_A)
            .build(),

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
     * Dependencies initialized: InventoryArea, InventoryAreaCount, InventoryItem, InventoryItemSize
     * @returns 14 items counts, 2 items for each test count, 1 for area A, 1 for area B, 2 for area C, 3 for area D
     */
    public async getTestInventoryAreaItemCountEntities(testContext: DatabaseTestContext): Promise<InventoryAreaItem[]> {
        await this.initInventoryAreaCountTestDatabase(testContext);
        await this.inventoryItemTestUtil.initInventoryItemSizeTestDatabase(testContext);

        const results: InventoryAreaItem[] = [];
        const countsRequest = await this.countService.findAll({ relations: ["inventoryArea"]});
        const counts = countsRequest.items;
        const itemsRequest = await this.inventoryItemService.findAll({ relations: ["sizes"] });
        const items = itemsRequest.items;
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
                .sizeById(sizeA.id)
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
                .sizeById(sizeB.id)
                .unitAmount(1)
                .measureAmount(1)
                .build()
            );
        }
        return results;
    }
    
    /**
     * - Inserts InventoryArea entities into the test database.
     * - Adds cleanup function to testContext
     * - No dependencies
     * @param testContext provides addCleanupFunction() to clear database after test
     */
    public async initInventoryAreaTestDatabase(testContext: DatabaseTestContext): Promise<void> {
        const areas = await this.getTestInventoryAreaEntities(testContext);
        testContext.addCleanupFunction(() => this.cleanupInventoryAreaTestDatabase());
        const toInsert: InventoryArea[] = [];

        for(const area of areas){
            const exists = await this.areaService.findOneByName(area.name);
            if(!exists){ toInsert.push(area); }
        }
        await this.areaService.insertEntities(toInsert);
    }

    /**
     * - Inserts test InventoryAreaCount entities into the database.
     * - Depends on InventoryArea, which is called to be initialized automatically.
     * - cleanup functions are added to the test context
     * @param testContext provides addCleanupFunction() for entitiy and its dependencies to clear database after test
     */
    public async initInventoryAreaCountTestDatabase(testContext: DatabaseTestContext): Promise<void> {
        testContext.addCleanupFunction(() => this.cleanupInventoryAreaCountTestDatabase());
        await this.countService.insertEntities(
            await this.getTestInventoryAreaCountEntities(testContext)
        );
    }

    /**
     * - Inserts test InventoryAreaItemCount entities into the database
     * - Depends on InventoryAreaCount, InventoryArea, InventoryItem, and InventoryItemSize
     * - Dependencies are "recursively" called in the same manner as this function.
     * - Adds cleanup function for this entity and all of its dependencies through the testContext.
     * @param testContext provides addCleanupFunction() for entitiy and its dependencies to clear database after test
     */
    public async initInventoryAreaItemCountTestDatabase(testContext: DatabaseTestContext): Promise<void> {
        testContext.addCleanupFunction(() => this.cleanupInventoryAreaItemCountTestDatabase());
        await this.itemCountService.insertEntities(
            await this.getTestInventoryAreaItemCountEntities(testContext)
        );
    }

    /**
     * Deletes all rows in InventoryArea table
     */
    public async cleanupInventoryAreaTestDatabase(): Promise<void> {
        await this.areaService.getQueryBuilder().delete().execute();
    }

    /**
     * Deletes all rows in InventoryAreaCount table
     */
    public async cleanupInventoryAreaCountTestDatabase(): Promise<void> {
        await this.countService.getQueryBuilder().delete().execute();
    }

    /**
     * Deletes all rows in InventoryAreaItemCount table
     */
    public async cleanupInventoryAreaItemCountTestDatabase(): Promise<void> {
        await this.itemCountService.getQueryBuilder().delete().execute();
    }

    public createInventoryAreaItemDtos(
        inventoryAreaId: number, areaCountId: number, 
        itemConfigs: {itemId: number, itemSizeId?: number, sizeDto?: CreateInventoryItemSizeDto}[]
    ){
        let unitAmount = 1;
        let measureAmount = 1;
        const results: CreateInventoryAreaItemDto[] = [];

        for(const item of itemConfigs){
            results.push({
                mode: 'create',
                inventoryAreaId,
                areaCountId,
                unitAmount: unitAmount++,
                measureAmount: measureAmount++,
                inventoryItemId: item.itemId,
                itemSizeId: item.itemSizeId,
                itemSizeDto: item.sizeDto
            } as CreateInventoryAreaItemDto)
        }
        return results;
    }
}