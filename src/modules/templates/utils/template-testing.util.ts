import { Injectable } from "@nestjs/common";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { MenuItemTestingUtil } from "../../menu-items/utils/menu-item-testing.util";
import { TemplateMenuItem } from "../entities/template-menu-item.entity";
import { Template } from "../entities/template.entity";
import { TemplateMenuItemService } from "../services/template-menu-item.service";
import { TemplateService } from "../services/template.service";
import { getTestTemplateNames } from "./constants";

@Injectable()
export class TemplateTestingUtil {
    constructor(
        private readonly templateService: TemplateService,
        private readonly templateItemService: TemplateMenuItemService,

        private readonly menuItemService: MenuItemService,
        private readonly menuItemTestUtil: MenuItemTestingUtil,
    ){}

    public async getTemplateEntities(testContext: DatabaseTestContext): Promise<Template[]>{
        const templateNames = getTestTemplateNames();
        const results: Template[] = [];
        
        for(const name of templateNames){
            results.push({
                name: name,
            } as Template);
        }
        return results;
    }

    public async initTemplateTestDatabase(testContext: DatabaseTestContext): Promise<void>{
        testContext.addCleanupFunction(() => this.cleanupTemplateTestDatabase());

        const templates = await this.getTemplateEntities(testContext);

        await this.templateService.insertEntities(templates);
    }

    public async cleanupTemplateTestDatabase(): Promise<void>{
        await this.templateService.getQueryBuilder().delete().execute();
    }

    public async getTemplateMenuItemEntities(testContext: DatabaseTestContext): Promise<TemplateMenuItem[]>{
        await this.menuItemTestUtil.initMenuItemTestDatabase(testContext);
        await this.initTemplateTestDatabase(testContext);

        const items = await this.menuItemService.findAll();
        if(!items){ throw new Error(); }
        let itemIdx = 0;
        
        const templates = await this.templateService.findAll();
        if(!templates){ throw new Error();}

        const results: TemplateMenuItem[] = [];

        for(const template of templates){
            for(let i = 0; i < 3; i++){
                results.push({
                    displayName: "testDisplayName"+itemIdx,
                    menuItem: items[itemIdx % items.length],
                    tablePosIndex: itemIdx,
                    template,
                } as TemplateMenuItem);
                itemIdx++;
            }
        }
        return results;
    }

    public async initTemplateMenuItemTestDatabase(testContext: DatabaseTestContext): Promise<void>{
        testContext.addCleanupFunction(() => this.cleanupTemplateMenuItemTestDatabase());

        const items = await this.getTemplateMenuItemEntities(testContext);

        await this.templateItemService.insertEntities(items);
    }

    public async cleanupTemplateMenuItemTestDatabase(): Promise<void>{
        await this.templateItemService.getQueryBuilder().delete().execute();
    }
}