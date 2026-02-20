import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
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
        await this.templateRepo.insert(await this.getTemplateEntities(testContext));
    }

    public async cleanupTemplateTestDatabase(): Promise<void> {
        //await this.templateRepo.delete({});
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
        let itemIdx = 0;

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
        await this.templateItemRepo.insert(
            await this.getTemplateMenuItemEntities(testContext),
        );
    }

    public async cleanupTemplateMenuItemTestDatabase(): Promise<void> {
        //await this.templateItemRepo.delete({});
        await this.templateItemRepo.deleteAll();
    }
}
