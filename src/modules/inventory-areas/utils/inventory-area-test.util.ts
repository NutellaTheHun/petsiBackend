import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { NestedCreateInventoryItemSizeDto } from '../../inventory-items/dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { InventoryItemTestingUtil } from '../../inventory-items/utils/inventory-item-testing.util';
import { InventoryAreaCountBuilder } from '../builders/inventory-area-count.builder';
import { InventoryAreaItemBuilder } from '../builders/inventory-area-item.builder';
import { InventoryAreaBuilder } from '../builders/inventory-area.builder';
import { NestedCreateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-create-inventory-area-item.dto';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryAreaItem } from '../entities/inventory-area-item.entity';
import { InventoryArea } from '../entities/inventory-area.entity';
import { AREA_A, AREA_B, AREA_C, AREA_D, getAreaNames } from './constants';

@Injectable()
export class InventoryAreaTestUtil {
    // Flags to prevent duplicate initialization of test data
    private initCounts = false;
    private initItems = false;
    private initAreas = false;

    constructor(
        @InjectRepository(InventoryArea)
        private readonly areaRepo: Repository<InventoryArea>,
        private readonly areaBuilder: InventoryAreaBuilder,

        @InjectRepository(InventoryAreaCount)
        private readonly areaCountRepo: Repository<InventoryAreaCount>,
        private readonly areaCountBuilder: InventoryAreaCountBuilder,

        @InjectRepository(InventoryAreaItem)
        private readonly areaItemRepo: Repository<InventoryAreaItem>,
        private readonly areaItemBuilder: InventoryAreaItemBuilder,

        @InjectRepository(InventoryItem)
        private readonly inventoryItemRepo: Repository<InventoryItem>,

        private readonly inventoryItemTestUtil: InventoryItemTestingUtil,
    ) { }

    /**
     * Dependencies initialized: None
     * @returns 4 Inventory areas, Area_A, B, C, and D
     */
    public async getTestInventoryAreaEntities(
        testContext: DatabaseTestContext,
    ): Promise<InventoryArea[]> {
        const results: InventoryArea[] = [];
        const names = getAreaNames();

        for (const name of names) {
            results.push(await this.areaBuilder.reset().areaName(name).build());
        }
        return results;
    }

    /**
     * Dependencies initialized: InventoryArea
     * @returns 7 InventoryAreaCount entites (1 for area_a, 1 for area_b, 2 for area_c, 3 for area_d),
     * no Ids, ready to be inserted into DB
     */
    public async getTestInventoryAreaCountEntities(
        testContext: DatabaseTestContext,
    ): Promise<InventoryAreaCount[]> {
        await this.initInventoryAreaTestDatabase(testContext);

        return [
            await this.areaCountBuilder.reset().inventoryAreaByName(AREA_A).build(),

            await this.areaCountBuilder.reset().inventoryAreaByName(AREA_B).build(),

            await this.areaCountBuilder.reset().inventoryAreaByName(AREA_C).build(),
            await this.areaCountBuilder.reset().inventoryAreaByName(AREA_C).build(),

            await this.areaCountBuilder.reset().inventoryAreaByName(AREA_D).build(),
            await this.areaCountBuilder.reset().inventoryAreaByName(AREA_D).build(),
            await this.areaCountBuilder.reset().inventoryAreaByName(AREA_D).build(),
        ];
    }

    /**
     * Dependencies initialized: InventoryArea, InventoryAreaCount, InventoryItem, InventoryItemSize
     * @returns 14 items counts, 2 items for each test count, 1 for area A, 1 for area B, 2 for area C, 3 for area D
     */
    public async getTestInventoryAreaItemCountEntities(
        testContext: DatabaseTestContext,
    ): Promise<InventoryAreaItem[]> {
        await this.initInventoryAreaCountTestDatabase(testContext);
        await this.inventoryItemTestUtil.initInventoryItemSizeTestDatabase(
            testContext,
        );

        const results: InventoryAreaItem[] = [];
        const counts = await this.areaCountRepo.find({
            relations: ['inventoryArea'],
        });

        const items = await this.inventoryItemRepo.find({
            relations: ['sizes'],
        });
        let itemPtr = 0;

        for (let i = 0; i < counts.length; i++) {
            const itemA = items[itemPtr++ % items.length];
            if (!itemA.sizes) {
                throw new Error('itemA sizes null');
            }
            const sizeA = itemA.sizes[0];
            results.push(
                await this.areaItemBuilder
                    .reset()
                    .parentInventoryCountById(counts[i].id)
                    .countedItemById(itemA.id)
                    .countedItemSizeById(sizeA.id)
                    .amount(1)
                    .build(),
            );

            const itemB = items[itemPtr++ % items.length];
            if (!itemB.sizes) {
                throw new Error('itemA sizes null');
            }
            const sizeB = itemB.sizes[0];
            results.push(
                await this.areaItemBuilder
                    .reset()
                    .parentInventoryCountById(counts[i].id)
                    .countedItemById(itemB.id)
                    .countedItemSizeById(sizeB.id)
                    .amount(1)
                    .build(),
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
    public async initInventoryAreaTestDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.initAreas) {
            return;
        }
        this.initAreas = true;

        testContext.addCleanupFunction(() =>
            this.cleanupInventoryAreaTestDatabase(),
        );

        const areas = await this.getTestInventoryAreaEntities(testContext);
        for (const area of areas) {
            if (await this.areaRepo.findOne({ where: { name: area.name } })) {
                continue;
            }
            await this.areaRepo.save(area);
        }
    }

    /**
     * - Inserts test InventoryAreaCount entities into the database.
     * - Depends on InventoryArea, which is called to be initialized automatically.
     * - cleanup functions are added to the test context
     * @param testContext provides addCleanupFunction() for entitiy and its dependencies to clear database after test
     */
    public async initInventoryAreaCountTestDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.initCounts) {
            return;
        }
        this.initCounts = true;

        testContext.addCleanupFunction(() =>
            this.cleanupInventoryAreaCountTestDatabase(),
        );

        await this.areaCountRepo.insert(
            await this.getTestInventoryAreaCountEntities(testContext),
        );
    }

    /**
     * - Inserts test InventoryAreaItemCount entities into the database
     * - Depends on InventoryAreaCount, InventoryArea, InventoryItem, and InventoryItemSize
     * - Dependencies are "recursively" called in the same manner as this function.
     * - Adds cleanup function for this entity and all of its dependencies through the testContext.
     * @param testContext provides addCleanupFunction() for entitiy and its dependencies to clear database after test
     */
    public async initInventoryAreaItemCountTestDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.initItems) {
            return;
        }
        this.initItems = true;

        testContext.addCleanupFunction(() =>
            this.cleanupInventoryAreaItemCountTestDatabase(),
        );

        await this.areaItemRepo.insert(
            await this.getTestInventoryAreaItemCountEntities(testContext),
        );
    }

    /**
     * Deletes all rows in InventoryArea table
     */
    public async cleanupInventoryAreaTestDatabase(): Promise<void> {
        this.initAreas = false;
        await this.areaRepo.deleteAll();
    }

    /**
     * Deletes all rows in InventoryAreaCount table
     */
    public async cleanupInventoryAreaCountTestDatabase(): Promise<void> {
        this.initCounts = false;
        await this.areaCountRepo.deleteAll();
    }

    /**
     * Deletes all rows in InventoryAreaItemCount table
     */
    public async cleanupInventoryAreaItemCountTestDatabase(): Promise<void> {
        this.initItems = false;
        await this.areaItemRepo.deleteAll();
    }

    public createNestedInventoryAreaItemDtos(
        itemConfigs: {
            itemId: number;
            itemSizeId?: number;
            sizeDto?: NestedCreateInventoryItemSizeDto;
        }[],
    ) {
        let unitAmount = 1;
        let createId = 0;
        const results: NestedCreateInventoryAreaItemDto[] = [];

        for (const item of itemConfigs) {
            if (item.sizeDto) {
                results.push(
                    plainToInstance(NestedCreateInventoryAreaItemDto, {
                        createId: `c${createId++}`,
                        amount: unitAmount++,
                        countedInventoryItemId: item.itemId,
                        //countedItemSizeId: item.itemSizeId,
                        countedItemSize: item.sizeDto,
                    }),
                );
            } else {
                results.push(
                    plainToInstance(NestedCreateInventoryAreaItemDto, {
                        createId: `c${createId++}`,
                        amount: unitAmount++,
                        countedInventoryItemId: item.itemId,
                        countedItemSizeId: item.itemSizeId,
                        //countedItemSize: item.sizeDto
                    }),
                );
            }
        }
        return results;
    }
}
