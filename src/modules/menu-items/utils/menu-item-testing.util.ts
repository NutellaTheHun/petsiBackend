import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemCategoryBuilder } from '../builders/menu-item-category.builder';
import { MenuItemContainerItemBuilder } from '../builders/menu-item-container-item.builder';
import { MenuItemSizeBuilder } from '../builders/menu-item-size.builder';
import { MenuItemBuilder } from '../builders/menu-item.builder';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem } from '../entities/menu-item.entity';
import {
    getNonVarMaxItemContainerTestNames,
    getTestCategoryNames,
    getTestItemNames,
    getTestSizeNames,
    getVarMaxItemContainerTestNames
} from './constants';
import { MENU_ITEM_TYPES } from './menu-item-type';

@Injectable()
export class MenuItemTestingUtil {
    private menuItemSizeInit = false;
    private menuItemCategoryInit = false;
    private menuItemInit = false;
    private menuItemContainerItemInit = false;

    constructor(
        @InjectRepository(MenuItem)
        private readonly itemRepo: Repository<MenuItem>,
        @InjectRepository(MenuItemSize)
        private readonly sizeRepo: Repository<MenuItemSize>,
        @InjectRepository(MenuItemCategory)
        private readonly categoryRepo: Repository<MenuItemCategory>,
        @InjectRepository(MenuItemContainerItem)
        private readonly containerItemRepo: Repository<MenuItemContainerItem>,

        private readonly itemBuilder: MenuItemBuilder,
        private readonly sizeBuilder: MenuItemSizeBuilder,
        private readonly categoryBuilder: MenuItemCategoryBuilder,
        private readonly containerItemBuilder: MenuItemContainerItemBuilder,
    ) { }

    // Menu Item Size
    public async getTestMenuItemSizeEntities(
        testContext: DatabaseTestContext,
    ): Promise<MenuItemSize[]> {
        const sizeNames = getTestSizeNames();
        const results: MenuItemSize[] = [];

        for (const name of sizeNames) {
            const exists = await this.sizeRepo.findOne({ where: { name } });
            if (exists) {
                continue;
            }

            results.push(await this.sizeBuilder.reset().name(name).build());
        }
        return results;
    }

    public async initMenuItemSizeTestDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.menuItemSizeInit) {
            return;
        }
        this.menuItemSizeInit = true;

        testContext.addCleanupFunction(() =>
            this.cleanupMenuItemSizeTestDatabase(),
        );
        const sizes = await this.getTestMenuItemSizeEntities(testContext);
        for (const size of sizes) {
            if (await this.sizeRepo.findOne({ where: { name: size.name } })) {
                continue;
            }
            await this.sizeRepo.save(size);
        }
    }

    public async cleanupMenuItemSizeTestDatabase(): Promise<void> {
        await this.sizeRepo.deleteAll();
    }

    // Menu Item Category
    public async getTestMenuItemCategoryEntities(
        testContext: DatabaseTestContext,
    ): Promise<MenuItemCategory[]> {
        const categoryNames = getTestCategoryNames();
        const results: MenuItemCategory[] = [];

        for (const name of categoryNames) {
            const exists = await this.categoryRepo.findOne({ where: { name } });
            if (exists) {
                continue;
            }

            results.push(await this.categoryBuilder.reset().name(name).build());
        }
        return results;
    }

    public async initMenuItemCategoryTestDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.menuItemCategoryInit) {
            return;
        }
        this.menuItemCategoryInit = true;

        testContext.addCleanupFunction(() =>
            this.cleanupMenuItemCategoryTestDatabase(),
        );
        const categories = await this.getTestMenuItemCategoryEntities(testContext);
        for (const category of categories) {
            if (await this.categoryRepo.findOne({ where: { name: category.name } })) {
                continue;
            }
            await this.categoryRepo.save(category);
        }
    }

    public async cleanupMenuItemCategoryTestDatabase(): Promise<void> {
        await this.categoryRepo.deleteAll();
    }

    // Menu Item

    /**
     * Creates Menu Item entities of type single and container
     * @param testContext
     */
    public async getTestMenuItemEntities(
        testContext: DatabaseTestContext,
    ): Promise<MenuItem[]> {
        await this.initMenuItemSizeTestDatabase(testContext);
        await this.initMenuItemCategoryTestDatabase(testContext);


        const categoryIds = (await this.categoryRepo.find()).map((cat) => cat.id);
        let catIdx = 0;
        const sizeIds = (await this.sizeRepo.find()).map((size) => size.id);
        let sizeIdx = 0;
        const results: MenuItem[] = [];

        // Type Single Items
        const itemNames = getTestItemNames();
        for (const itemName of itemNames) {
            const exists = await this.itemRepo.findOne({ where: { name: itemName } });
            if (exists) {
                continue;
            }

            let type = MENU_ITEM_TYPES.SINGLE;

            results.push(
                await this.itemBuilder
                    .reset()
                    .categorybyId(categoryIds[catIdx++ % categoryIds.length])
                    .name(itemName)
                    .validSizesById([
                        sizeIds[sizeIdx++ % sizeIds.length],
                        sizeIds[sizeIdx++ % sizeIds.length],
                    ])
                    .type(type)
                    .build(),
            );

        }

        // Type Fixed Container Items
        const nonVarcontainerNames = getNonVarMaxItemContainerTestNames();
        for (const containerName of nonVarcontainerNames) {
            const exists = await this.itemRepo.findOne({ where: { name: containerName } });
            if (exists) {
                continue;
            }

            results.push(
                await this.itemBuilder.reset()
                    .name(containerName)
                    .type(MENU_ITEM_TYPES.CONTAINER)
                    .categorybyId(categoryIds[catIdx++ % categoryIds.length])
                    .validSizesById([
                        sizeIds[sizeIdx++ % sizeIds.length],
                        sizeIds[sizeIdx++ % sizeIds.length],
                    ])
                    .build());
        }

        // Type Variable Container Items
        const varMaxContainerNames = getVarMaxItemContainerTestNames();
        for (const containerName of varMaxContainerNames) {
            const exists = await this.itemRepo.findOne({ where: { name: containerName } });
            if (exists) {
                continue;
            }

            results.push(
                await this.itemBuilder.reset()
                    .name(containerName)
                    .type(MENU_ITEM_TYPES.CONTAINER)
                    .variableMaxAmount(6)
                    .categorybyId(categoryIds[catIdx++ % categoryIds.length])
                    .validSizesById([
                        sizeIds[sizeIdx++ % sizeIds.length],
                    ])
                    .build());

        }

        return results;
    }

    public async initMenuItemTestDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.menuItemInit) {
            return;
        }
        this.menuItemInit = true;

        testContext.addCleanupFunction(() => this.cleanupMenuItemTestDatabase());
        const items = await this.getTestMenuItemEntities(testContext)
        for (const item of items) {
            if (await this.itemRepo.findOne({ where: { name: item.name } })) {
                continue;
            }
            await this.itemRepo.save(item);
        }
    }

    public async cleanupMenuItemTestDatabase(): Promise<void> {
        await this.itemRepo.deleteAll();
    }


    /**
     * Returns MenuItemComponents where ItemF is a container of items A and B, and itemG is a container of items C and D.
     * @param testContext
     * @returns
     */
    public async getTestMenuItemContainerItemEntities(
        testContext: DatabaseTestContext,
    ): Promise<MenuItemContainerItem[]> {
        await this.initMenuItemTestDatabase(testContext);

        const singleItems = await this.itemRepo.find({ where: { type: MENU_ITEM_TYPES.SINGLE }, relations: ['sizes'] });
        let singleItemIdx = 0;
        const singleItemMax = 3;
        let singleItemSizeIdx = 0;

        const containerItems = await this.itemRepo.find({ where: { type: MENU_ITEM_TYPES.CONTAINER }, relations: ['sizes'] });

        const results: MenuItemContainerItem[] = [];

        for (const container of containerItems) {
            if (container.variableMaxAmount) {
                for (let i = 0; i < singleItemMax; i++) {
                    const containedItem = singleItems[singleItemIdx++ % singleItems.length];
                    const containedItemSize = containedItem.sizes[singleItemSizeIdx++ % containedItem.sizes.length];
                    results.push(await this.containerItemBuilder.reset()
                        .parentContainerById(container.id)
                        .parentContainerSizeById(container.sizes[0].id)
                        .containedItemById(containedItem.id)
                        .containedItemSizeById(containedItemSize.id)
                        .quantity(container.variableMaxAmount)
                        .build());
                }
            } else {
                for (const containerSize of container.sizes) {
                    for (let i = 0; i < singleItemMax; i++) {
                        const containedItem = singleItems[singleItemIdx++ % singleItems.length];
                        const containedItemSize = containedItem.sizes[singleItemSizeIdx++ % containedItem.sizes.length];
                        results.push(await this.containerItemBuilder.reset()
                            .parentContainerById(container.id)
                            .parentContainerSizeById(containerSize.id)
                            .containedItemById(containedItem.id)
                            .containedItemSizeById(containedItemSize.id)
                            .quantity(1)
                            .build());
                    }
                }
            }
        }

        return results;
    }

    /**
     * Inserts MenuItemComponent Entites into the database
     *
     * ItemF is a container of items A and B,
     *
     * itemG is a container of items C and D.
     * @param testContext
     */
    public async initMenuItemContainerItemTestDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.menuItemContainerItemInit) {
            return;
        }
        this.menuItemContainerItemInit = true;
        testContext.addCleanupFunction(() =>
            this.cleanupMenuItemContainerItemTestDatabase(),
        );

        const containerItems = await this.getTestMenuItemContainerItemEntities(testContext);
        for (const containerItem of containerItems) {
            // if containerItem is not already in the database, save it
            if (await this.containerItemRepo.findOne({ where: { parentMenuItem: { id: containerItem.parentMenuItem.id }, parentItemSize: { id: containerItem.parentItemSize.id }, containedMenuItem: { id: containerItem.containedMenuItem.id }, containedItemSize: { id: containerItem.containedItemSize.id } } })) {
                continue;
            }
            await this.containerItemRepo.save(containerItem);
        }
    }

    public async cleanupMenuItemContainerItemTestDatabase(): Promise<void> {
        await this.containerItemRepo.deleteAll();
    }
}
