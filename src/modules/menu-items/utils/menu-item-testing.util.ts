import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { MenuItemCategoryBuilder } from "../builders/menu-item-category.builder";
import { MenuItemSizeBuilder } from "../builders/menu-item-size.builder";
import { MenuItemBuilder } from "../builders/menu-item.builder";
import { MenuItemCategory } from "../entities/menu-item-category.entity";
import { MenuItemSize } from "../entities/menu-item-size.entity";
import { MenuItem } from "../entities/menu-item.entity";
import { MenuItemCategoryService } from "../services/menu-item-category.service";
import { MenuItemSizeService } from "../services/menu-item-size.service";
import { MenuItemService } from "../services/menu-item.service";
import { getTestCategoryNames, getTestItemNames, getTestSizeNames, item_a, item_b, item_c, item_d, item_f, item_g } from "./constants";
import { MenuItemComponent } from "../entities/menu-item-component.entity";
import { MenuItemComponentService } from "../services/menu-item-component.service";
import { MenuItemComponentBuilder } from "../builders/menu-item-component.builder";

@Injectable()
export class MenuItemTestingUtil {
    constructor(
        private readonly itemService: MenuItemService,
        private readonly sizeService: MenuItemSizeService,
        private readonly categoryService: MenuItemCategoryService,
        private readonly componentService: MenuItemComponentService,

        private readonly itemBuilder: MenuItemBuilder,
        private readonly sizeBuilder: MenuItemSizeBuilder,
        private readonly categoryBuilder: MenuItemCategoryBuilder,
        private readonly componentBuilder: MenuItemComponentBuilder,
    ){ }

    // Menu Item Size
    public async getTestMenuItemSizeEntities(testContext: DatabaseTestContext): Promise<MenuItemSize[]>{
        const sizeNames = getTestSizeNames();
        const results: MenuItemSize[] = [];

        for(const name of sizeNames){
            results.push(
                await this.sizeBuilder.reset()
                    .name(name)
                    .build()
            )
        }
        return results;
    }

    public async initMenuItemSizeTestDatabase(testContext: DatabaseTestContext): Promise<void>{
        const sizes = await this.getTestMenuItemSizeEntities(testContext);
        testContext.addCleanupFunction(() => this.cleanupMenuItemSizeTestDatabase());

        await this.sizeService.insertEntities(sizes);
    }

    public async cleanupMenuItemSizeTestDatabase(): Promise<void> {
        await this.sizeService.getQueryBuilder().delete().execute();
    }

    // Menu Item Category
    public async getTestMenuItemCategoryEntities(testContext: DatabaseTestContext): Promise<MenuItemCategory[]>{
        const categoryNames = getTestCategoryNames();
        const results: MenuItemCategory[] = [];

        for(const name of categoryNames){
            results.push(
                await this.categoryBuilder.reset()
                    .name(name)
                    .build()
            )
        }
        return results;
    }

    public async initMenuItemCategoryTestDatabase(testContext: DatabaseTestContext): Promise<void>{
        const categories = await this.getTestMenuItemCategoryEntities(testContext);
        testContext.addCleanupFunction(() => this.cleanupMenuItemCategoryTestDatabase());

        await this.categoryService.insertEntities(categories);
    }

    public async cleanupMenuItemCategoryTestDatabase(): Promise<void> {
        await this.categoryService.getQueryBuilder().delete().execute();
    }


    // Menu Item

    /**
     * Creates Menu Item entities with category and name set
     * @param testContext 
     */
    public async getTestMenuItemEntities(testContext: DatabaseTestContext): Promise<MenuItem[]>{
        await this.initMenuItemSizeTestDatabase(testContext);
        await this.initMenuItemCategoryTestDatabase(testContext);

        const itemNames = getTestItemNames();
        const categoryIds = (await this.categoryService.findAll()).items.map(cat => cat.id);
        let catIdx = 0;
        const sizeIds = (await this.sizeService.findAll()).items.map(size => size.id);
        let sizeIdx = 0;
        const results: MenuItem[] = [];

        for(const itemName of itemNames){
            results.push(
                await this.itemBuilder.reset()
                    .categorybyId(categoryIds[catIdx++ % categoryIds.length])
                    .name(itemName)
                    .validSizesById([ sizeIds[sizeIdx++ % sizeIds.length], sizeIds[sizeIdx++ % sizeIds.length] ])
                    .build()
            )
        }
        return results;
    }

    public async initMenuItemTestDatabase(testContext: DatabaseTestContext): Promise<void>{
        const items = await this.getTestMenuItemEntities(testContext);
        testContext.addCleanupFunction(() => this.cleanupMenuItemTestDatabase());

        await this.itemService.insertEntities(items);
    }

    public async cleanupMenuItemTestDatabase(): Promise<void> {
        await this.itemService.getQueryBuilder().delete().execute();
    }


    // Menu Item Component

    /**
     * Returns MenuItemComponents where ItemF is a container of items A and B, and itemG is a container of items C and D.
     * @param testContext 
     * @returns 
     */
    public async getTestMenuItemComponentEntities(testContext: DatabaseTestContext): Promise<MenuItemComponent[]>{
        await this.initMenuItemTestDatabase(testContext);
        
        const itemF = await this.itemService.findOneByName(item_f, ['validSizes']);
        if(!itemF){ throw new NotFoundException(); }
        if(!itemF.validSizes){ throw new Error(); }

        const itemA = await this.itemService.findOneByName(item_a, ['validSizes']);
        if(!itemA){ throw new NotFoundException(); }
        if(!itemA.validSizes){ throw new Error(); }

        const itemB = await this.itemService.findOneByName(item_b, ['validSizes']);
        if(!itemB){ throw new NotFoundException(); }
        if(!itemB.validSizes){ throw new Error(); }


        const itemG = await this.itemService.findOneByName(item_g, ['validSizes']);
        if(!itemG){ throw new NotFoundException(); }
        if(!itemG.validSizes){ throw new Error(); }

        const itemC = await this.itemService.findOneByName(item_c, ['validSizes']);
        if(!itemC){ throw new NotFoundException(); }
        if(!itemC.validSizes){ throw new Error(); }

        const itemD = await this.itemService.findOneByName(item_d, ['validSizes']);
        if(!itemD){ throw new NotFoundException(); }
        if(!itemD.validSizes){ throw new Error(); }

        const results = [
            {
                container: itemF,
                containerSize: itemF.validSizes[0],
                item: itemA,
                size: itemA.validSizes[0],
                quantity: 1,
            },
            {
                container: itemF,
                containerSize: itemF.validSizes[0],
                item: itemB,
                size: itemB.validSizes[0],
                quantity: 1,
            },

            {
                container: itemG,
                containerSize: itemG.validSizes[0],
                item: itemC,
                size: itemC.validSizes[0],
                quantity: 1,
            },
            {
                container: itemG,
                containerSize: itemG.validSizes[0],
                item: itemD,
                size: itemD.validSizes[0],
                quantity: 1,
            }
        ] as MenuItemComponent[];

        return results;
    }

    /**
     * Inserts MenuItemComponent Entites into the database where
     * where ItemF is a container of items A and B, and itemG is a container of items C and D.
     * @param testContext 
     */
    public async initMenuItemComponentTestDatabase(testContext: DatabaseTestContext): Promise<void>{
        const components = await this.getTestMenuItemComponentEntities(testContext);
        testContext.addCleanupFunction(() => this.cleanupMenuItemComponentTestDatabase());

        await this.componentService.insertEntities(components);
    }

    public async cleanupMenuItemComponentTestDatabase(): Promise<void> {
        await this.componentService.getQueryBuilder().delete().execute();
    }
}