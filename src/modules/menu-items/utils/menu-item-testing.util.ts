import { Injectable } from "@nestjs/common";
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
import { getTestCategoryNames, getTestItemNames, getTestSizeNames } from "./constants";
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

    public async getTestMenuItemComponentEntities(testContext: DatabaseTestContext): Promise<MenuItemComponent[]>{
        await this.initMenuItemTestDatabase(testContext);
        
        // const itemNames = getTestItemNames();
        const results: MenuItemComponent[] = [];

        return results;
    }

    public async initMenuItemComponentTestDatabase(testContext: DatabaseTestContext): Promise<void>{
        const components = await this.getTestMenuItemComponentEntities(testContext);
        testContext.addCleanupFunction(() => this.cleanupMenuItemComponentTestDatabase());

        await this.componentService.insertEntities(components);
    }

    public async cleanupMenuItemComponentTestDatabase(): Promise<void> {
        await this.componentService.getQueryBuilder().delete().execute();
    }
}