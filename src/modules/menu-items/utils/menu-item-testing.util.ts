import { Injectable, NotImplementedException } from "@nestjs/common";
import { MenuItemService } from "../services/menu-item.service";
import { MenuItemSizeService } from "../services/menu-item-size.service";
import { MenuItemCategoryService } from "../services/menu-item-category.service";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { MenuItemSize } from "../entities/menu-item-size.entity";
import { MenuItemCategory } from "../entities/menu-item-category.entity";
import { MenuItem } from "../entities/menu-item.entity";
import { getTestCategoryNames, getTestItemNames } from "./constants";
import { MenuItemBuilder } from "../builders/menu-item.builder";
import { MenuItemSizeBuilder } from "../builders/menu-item-size.builder";
import { MenuItemCategoryBuilder } from "../builders/menu-item-category.builder";

@Injectable()
export class MenuItemTestingUtil {
    constructor(
        private readonly itemService: MenuItemService,
        private readonly sizeService: MenuItemSizeService,
        private readonly categoryService: MenuItemCategoryService,

        private readonly itemBuilder: MenuItemBuilder,
        private readonly sizeBuilder: MenuItemSizeBuilder,
        private readonly categoryBuilder: MenuItemCategoryBuilder,
    ){ }

    // Menu Item Size
    public async getTestMenuItemSizeEntities(testContext: DatabaseTestContext): Promise<MenuItemSize[]>{
        const sizeNames = getTestItemNames();
        const results: MenuItemSize[] = [];

        for(const name in sizeNames){
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

        for(const name in categoryNames){
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
    public async getTestMenuItemEntities(testContext: DatabaseTestContext): Promise<MenuItem[]>{
        await this.initMenuItemSizeTestDatabase(testContext);
        await this.initMenuItemCategoryTestDatabase(testContext);

        const itemNames = getTestItemNames();
        const results: MenuItem[] = [];

        // squareCatalogId?: string
        // squareCategoryId?: string
        // category?: MenuItemCategory
        // name: string
        // searchNames?: string[] | null
        // veganOption?: MenuItem
        // takeNBakeOption?: MenuItem
        // veganTakeNBakeOption?: MenuItem
        // validSizes?: MenuItemSize[] | null
        // isPOTM: boolean
        // isParbake: boolean
        throw new NotImplementedException();
    }

    public async initMenuItemTestDatabase(testContext: DatabaseTestContext): Promise<void>{
        const items = await this.getTestMenuItemEntities(testContext);
        testContext.addCleanupFunction(() => this.cleanupMenuItemTestDatabase());

        await this.itemService.insertEntities(items);
    }

    public async cleanupMenuItemTestDatabase(): Promise<void> {
        await this.itemService.getQueryBuilder().delete().execute();
    }
}