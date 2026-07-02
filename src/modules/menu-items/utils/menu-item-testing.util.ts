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
        this.menuItemSizeInit = false;
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
        this.menuItemCategoryInit = false;
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
        this.menuItemInit = false;
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
        this.menuItemContainerItemInit = false;
        await this.containerItemRepo.deleteAll();
    }

    // ─── Atomic-prefix seed methods ──────────────────────────────────────────────
    // These do NOT register cleanup — callers are responsible for deleting by ID.

    public async seedCategories(P = ''): Promise<{ categories: MenuItemCategory[] }> {
        const names = getTestCategoryNames();
        const categories: MenuItemCategory[] = [];
        for (const name of names) {
            const entityName = P ? `${P}-${name}` : name;
            const entity = await this.categoryBuilder.reset().name(entityName).build();
            categories.push(await this.categoryRepo.save(entity));
        }
        return { categories };
    }

    public async seedSizes(P = ''): Promise<{ sizes: MenuItemSize[] }> {
        const names = getTestSizeNames();
        const sizes: MenuItemSize[] = [];
        for (const name of names) {
            const entityName = P ? `${P}-${name}` : name;
            const entity = await this.sizeBuilder.reset().name(entityName).build();
            sizes.push(await this.sizeRepo.save(entity));
        }
        return { sizes };
    }

    /**
     * Seeds categories, sizes, 7 single items (a–g), 2 fixed container items, and 2 variable-max
     * container items.
     *
     * Single items each have sizes[0] and sizes[1].
     * Fixed container items each have sizes[2] and sizes[3].
     * Variable-max container items each have sizes[0] with variableMaxAmount = 6.
     */
    public async seedItems(P = ''): Promise<{
        categories: MenuItemCategory[];
        sizes: MenuItemSize[];
        singleItems: MenuItem[];
        fixedContainerItems: MenuItem[];
        varContainerItems: MenuItem[];
    }> {
        const { categories } = await this.seedCategories(P);
        const { sizes } = await this.seedSizes(P);

        const singleNames = getTestItemNames();
        const singleItems: MenuItem[] = [];
        for (let i = 0; i < singleNames.length; i++) {
            const name = P ? `${P}-${singleNames[i]}` : singleNames[i];
            const entity = await this.itemBuilder.reset()
                .name(name)
                .type(MENU_ITEM_TYPES.SINGLE)
                .categorybyId(categories[i % categories.length].id)
                .validSizesById([sizes[0].id, sizes[1].id])
                .build();
            const saved = await this.itemRepo.save(entity);
            singleItems.push(
                await this.itemRepo.findOneOrFail({ where: { id: saved.id }, relations: ['sizes', 'category'] }),
            );
        }

        const fixedContainerNames = getNonVarMaxItemContainerTestNames();
        const fixedContainerItems: MenuItem[] = [];
        for (const containerName of fixedContainerNames) {
            const name = P ? `${P}-${containerName}` : containerName;
            const entity = await this.itemBuilder.reset()
                .name(name)
                .type(MENU_ITEM_TYPES.CONTAINER)
                .categorybyId(categories[0].id)
                .validSizesById([sizes[2].id, sizes[3].id])
                .build();
            const saved = await this.itemRepo.save(entity);
            fixedContainerItems.push(
                await this.itemRepo.findOneOrFail({ where: { id: saved.id }, relations: ['sizes', 'category'] }),
            );
        }

        const varContainerNames = getVarMaxItemContainerTestNames();
        const varContainerItems: MenuItem[] = [];
        for (const containerName of varContainerNames) {
            const name = P ? `${P}-${containerName}` : containerName;
            const entity = await this.itemBuilder.reset()
                .name(name)
                .type(MENU_ITEM_TYPES.CONTAINER)
                .variableMaxAmount(6)
                .categorybyId(categories[1].id)
                .validSizesById([sizes[0].id])
                .build();
            const saved = await this.itemRepo.save(entity);
            varContainerItems.push(
                await this.itemRepo.findOneOrFail({ where: { id: saved.id }, relations: ['sizes', 'category'] }),
            );
        }

        return { categories, sizes, singleItems, fixedContainerItems, varContainerItems };
    }

    /**
     * Seeds everything from seedItems, then adds container lines.
     *
     * Fixed containers: 2 lines per size (containedItems: singleItems[0], singleItems[1]).
     * Variable-max containers: 2 lines each (containedItems: singleItems[2], singleItems[3], qty = 6).
     *
     * Returned containerLines are reloaded with relations including containedMenuItem.sizes.
     */
    public async seedContainerLines(P = ''): Promise<{
        categories: MenuItemCategory[];
        sizes: MenuItemSize[];
        singleItems: MenuItem[];
        fixedContainerItems: MenuItem[];
        varContainerItems: MenuItem[];
        containerLines: MenuItemContainerItem[];
    }> {
        const { categories, sizes, singleItems, fixedContainerItems, varContainerItems } = await this.seedItems(P);

        const rawLines: MenuItemContainerItem[] = [];

        for (const container of fixedContainerItems) {
            for (const containerSize of container.sizes) {
                for (let i = 0; i < Math.min(2, singleItems.length); i++) {
                    const containedItem = singleItems[i];
                    const line = await this.containerItemBuilder.reset()
                        .parentContainerById(container.id)
                        .parentContainerSizeById(containerSize.id)
                        .containedItemById(containedItem.id)
                        .containedItemSizeById(sizes[0].id)
                        .quantity(1)
                        .build();
                    rawLines.push(await this.containerItemRepo.save(line));
                }
            }
        }

        for (const container of varContainerItems) {
            const containerSize = container.sizes[0];
            for (let i = 2; i < Math.min(4, singleItems.length); i++) {
                const containedItem = singleItems[i];
                const line = await this.containerItemBuilder.reset()
                    .parentContainerById(container.id)
                    .parentContainerSizeById(containerSize.id)
                    .containedItemById(containedItem.id)
                    .containedItemSizeById(sizes[0].id)
                    .quantity(6)
                    .build();
                rawLines.push(await this.containerItemRepo.save(line));
            }
        }

        const containerLines: MenuItemContainerItem[] = [];
        for (const line of rawLines) {
            containerLines.push(
                await this.containerItemRepo.findOneOrFail({
                    where: { id: line.id },
                    relations: ['parentMenuItem', 'parentItemSize', 'containedMenuItem', 'containedItemSize', 'containedMenuItem.sizes'],
                }),
            );
        }

        return { categories, sizes, singleItems, fixedContainerItems, varContainerItems, containerLines };
    }
}
