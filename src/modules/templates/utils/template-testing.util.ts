import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemCategory } from '../../menu-items/entities/menu-item-category.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MenuItemTestingUtil } from '../../menu-items/utils/menu-item-testing.util';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { Template } from '../entities/template.entity';
import { getTestTemplateNames } from './constants';

@Injectable()
export class TemplateTestingUtil {
    private initTemplates = false;
    private initItems = false;

    constructor(
        @InjectRepository(Template)
        private readonly templateRepo: Repository<Template>,
        @InjectRepository(TemplateMenuItem)
        private readonly templateItemRepo: Repository<TemplateMenuItem>,

        @InjectRepository(MenuItem)
        private readonly menuItemRepo: Repository<MenuItem>,

        private readonly menuItemTestUtil: MenuItemTestingUtil,
    ) { }

    public async getTemplateEntities(
        testContext: DatabaseTestContext,
    ): Promise<Template[]> {
        const templateNames = getTestTemplateNames();
        const results: Template[] = [];

        for (const name of templateNames) {
            results.push({
                name: name,
            } as Template);
        }
        return results;
    }

    public async initTemplateTestDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.initTemplates) {
            return;
        }
        this.initTemplates = true;

        testContext.addCleanupFunction(() => this.cleanupTemplateTestDatabase());
        const templates = await this.getTemplateEntities(testContext);
        for (const template of templates) {
            const exists = await this.templateRepo.findOne({
                where: { name: template.name },
            });
            if (!exists) {
                await this.templateRepo.save(template);
            }
        }
    }

    public async cleanupTemplateTestDatabase(): Promise<void> {
        await this.templateRepo.deleteAll();
    }

    public async getTemplateMenuItemEntities(
        testContext: DatabaseTestContext,
    ): Promise<TemplateMenuItem[]> {
        await this.menuItemTestUtil.initMenuItemTestDatabase(testContext);
        await this.initTemplateTestDatabase(testContext);

        const items = await this.menuItemRepo.find();
        if (!items) {
            throw new Error();
        }
        let itemIdx = 1;

        const templates = await this.templateRepo.find();
        if (!templates) {
            throw new Error();
        }

        const results: TemplateMenuItem[] = [];

        for (const template of templates) {
            for (let i = 0; i < 3; i++) {
                results.push({
                    displayName: 'testDisplayName' + itemIdx,
                    menuItem: items[itemIdx % items.length],
                    tablePosIndex: itemIdx,
                    parentTemplate: template,
                } as TemplateMenuItem);
                itemIdx++;
            }
        }
        return results;
    }

    public async initTemplateMenuItemTestDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.initItems) {
            return;
        }
        this.initItems = true;

        testContext.addCleanupFunction(() =>
            this.cleanupTemplateMenuItemTestDatabase(),
        );
        const templateItems = await this.getTemplateMenuItemEntities(testContext);
        for (const templateItem of templateItems) {
            const exists = await this.templateItemRepo.findOne({
                where: { menuItem: { id: templateItem.menuItem.id }, parentTemplate: { id: templateItem.parentTemplate.id } },
            });
            if (!exists) {
                await this.templateItemRepo.save(templateItem);
            }
        }
    }

    public async cleanupTemplateMenuItemTestDatabase(): Promise<void> {
        await this.templateItemRepo.deleteAll();
    }

    // ─── Atomic-prefix seed methods ──────────────────────────────────────────────
    // These do NOT register cleanup — callers are responsible for deleting by ID.

    public async seedTemplates(P: string = ''): Promise<{ templates: Template[] }> {
        const names = getTestTemplateNames();
        const templates: Template[] = [];
        for (const name of names) {
            const entityName = P ? `${P}-${name}` : name;
            templates.push(await this.templateRepo.save({ name: entityName } as Template));
        }
        return { templates };
    }

    /**
     * Delegates to MenuItemTestingUtil.seedItems(P) for the menu item dependency chain.
     *
     * 3 template menu item rows per seeded template, round-robin over the combined
     * single/fixed-container/variable-container menu items.
     */
    public async seedTemplateMenuItems(P: string = ''): Promise<{
        templates: Template[];
        categories: MenuItemCategory[];
        sizes: MenuItemSize[];
        singleItems: MenuItem[];
        fixedContainerItems: MenuItem[];
        varContainerItems: MenuItem[];
        templateMenuItems: TemplateMenuItem[];
    }> {
        const { templates } = await this.seedTemplates(P);
        const { categories, sizes, singleItems, fixedContainerItems, varContainerItems } =
            await this.menuItemTestUtil.seedItems(P);

        const allItems = [...singleItems, ...fixedContainerItems, ...varContainerItems];
        const templateMenuItems: TemplateMenuItem[] = [];
        let idx = 0;
        for (const template of templates) {
            for (let i = 0; i < 3; i++) {
                const item = allItems[idx % allItems.length];
                const entity = {
                    displayName: P ? `${P}-row${idx + 1}` : `row${idx + 1}`,
                    menuItem: item,
                    tablePosIndex: idx + 1,
                    parentTemplate: template,
                } as TemplateMenuItem;
                templateMenuItems.push(await this.templateItemRepo.save(entity));
                idx++;
            }
        }

        return {
            templates,
            categories,
            sizes,
            singleItems,
            fixedContainerItems,
            varContainerItems,
            templateMenuItems,
        };
    }
}
