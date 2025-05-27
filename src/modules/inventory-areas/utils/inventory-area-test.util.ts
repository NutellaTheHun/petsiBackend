import { Injectable } from "@nestjs/common";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateChildInventoryItemSizeDto } from "../../inventory-items/dto/inventory-item-size/create-child-inventory-item-size.dto";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { InventoryItemTestingUtil } from "../../inventory-items/utils/inventory-item-testing.util";
import { InventoryAreaCountBuilder } from "../builders/inventory-area-count.builder";
import { InventoryAreaItemBuilder } from "../builders/inventory-area-item.builder";
import { InventoryAreaBuilder } from "../builders/inventory-area.builder";
import { CreateChildInventoryAreaItemDto } from "../dto/inventory-area-item/create-child-inventory-area-item.dto";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryAreaItem } from "../entities/inventory-area-item.entity";
import { InventoryArea } from "../entities/inventory-area.entity";
import { InventoryAreaCountService } from "../services/inventory-area-count.service";
import { InventoryAreaItemService } from "../services/inventory-area-item.service";
import { InventoryAreaService } from "../services/inventory-area.service";
import { AREA_A, AREA_B, AREA_C, AREA_D, getAreaNames } from "./constants";

@Injectable()
export class InventoryAreaTestUtil {
    private initCounts = false;
    private initItems = false;
    private initAreas = false;

    constructor(
        private readonly areaService: InventoryAreaService,
        private readonly areaBuilder: InventoryAreaBuilder,

        private readonly countService: InventoryAreaCountService,
        private readonly areaCountBuilder: InventoryAreaCountBuilder,

        private readonly itemCountService: InventoryAreaItemService,
        private readonly itemCountBuilder: InventoryAreaItemBuilder,

        private readonly inventoryItemService: InventoryItemService,

        private readonly inventoryItemTestUtil: InventoryItemTestingUtil,
    ) { }

    /**
     * Dependencies initialized: None
     * @returns 4 Inventory areas, Area_A, B, C, and D
     */
    public async getTestInventoryAreaEntities(testContext: DatabaseTestContext): Promise<InventoryArea[]> {
        const results: InventoryArea[] = [];
        const names = getAreaNames();

        for (const name of names) {
            results.push(
                await this.areaBuilder.reset()
                    .areaName(name)
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
        const countsRequest = await this.countService.findAll({ relations: ["inventoryArea"] });
        const counts = countsRequest.items;
        const itemsRequest = await this.inventoryItemService.findAll({ relations: ['itemSizes'] });
        const items = itemsRequest.items;
        let itemPtr = 0;

        for (let i = 0; i < counts.length; i++) {
            const itemA = items[itemPtr++ % items.length];
            if (!itemA.itemSizes) { throw new Error("itemA sizes null"); }
            const sizeA = itemA.itemSizes[0];
            results.push(
                await this.itemCountBuilder.reset()
                    .parentInventoryCountById(counts[i].id)
                    .countedItemById(itemA.id)
                    .countedItemSizeById(sizeA.id)
                    .amount(1)
                    .build()
            );

            const itemB = items[itemPtr++ % items.length];
            if (!itemB.itemSizes) { throw new Error("itemA sizes null"); }
            const sizeB = itemB.itemSizes[0];
            results.push(
                await this.itemCountBuilder.reset()
                    .parentInventoryCountById(counts[i].id)
                    .countedItemById(itemB.id)
                    .countedItemSizeById(sizeB.id)
                    .amount(1)
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
        if (this.initAreas) {
            return;
        }
        this.initAreas = true;

        const areas = await this.getTestInventoryAreaEntities(testContext);
        testContext.addCleanupFunction(() => this.cleanupInventoryAreaTestDatabase());
        const toInsert: InventoryArea[] = [];

        /*for(const area of areas){
            const exists = await this.areaService.findOneByName(area.areaName);
            if(!exists){ toInsert.push(area); }
        }*/
        await this.areaService.insertEntities(/*toInsert*/areas);
    }

    /**
     * - Inserts test InventoryAreaCount entities into the database.
     * - Depends on InventoryArea, which is called to be initialized automatically.
     * - cleanup functions are added to the test context
     * @param testContext provides addCleanupFunction() for entitiy and its dependencies to clear database after test
     */
    public async initInventoryAreaCountTestDatabase(testContext: DatabaseTestContext): Promise<void> {
        if (this.initCounts) {
            return;
        }
        this.initCounts = true;

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
        if (this.initItems) {
            return;
        }
        this.initItems = true;

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
       /* inventoryAreaId: number,*/ areaCountId: number,
        itemConfigs: { itemId: number, itemSizeId?: number, sizeDto?: CreateChildInventoryItemSizeDto }[]
    ) {
        let unitAmount = 1;
        let measureAmount = 1;
        const results: CreateChildInventoryAreaItemDto[] = [];

        for (const item of itemConfigs) {
            if (item.sizeDto) {
                results.push({
                    mode: 'create',
                    countedAmount: unitAmount++,
                    measureAmount: measureAmount++,
                    countedInventoryItemId: item.itemId,
                    //itemSizeId: item.itemSizeId,
                    countedItemSizeDto: item.sizeDto
                } as CreateChildInventoryAreaItemDto)
            } else {
                results.push({
                    mode: 'create',
                    countedAmount: unitAmount++,
                    measureAmount: measureAmount++,
                    countedInventoryItemId: item.itemId,
                    countedItemSizeId: item.itemSizeId,
                    //itemSizeDto: item.sizeDto
                } as CreateChildInventoryAreaItemDto)
            }
        }
        return results;
    }
}