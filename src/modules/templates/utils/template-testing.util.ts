import { Injectable, NotImplementedException } from "@nestjs/common";
import { TemplateService } from "../services/template.service";
import { TemplateMenuItemService } from "../services/template-menu-item.service";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { Template } from "../entities/template.entity";

@Injectable()
export class TemplateTestingUtil {
    constructor(
        private readonly templateService: TemplateService,
        private readonly templateItemService: TemplateMenuItemService,
    ){}

    public async getTemplateEntities(testContext: DatabaseTestContext): Promise<Template[]>{
        throw new NotImplementedException();
    }

    public async initTemplateTestDatabase(testContext: DatabaseTestContext): Promise<Template[]>{
        throw new NotImplementedException();
    }

    public async cleanupTemplateTestDatabase(testContext: DatabaseTestContext): Promise<Template[]>{
        throw new NotImplementedException();
    }

    public async getTemplateMenuItemEntities(testContext: DatabaseTestContext): Promise<Template[]>{
        throw new NotImplementedException();
    }

    public async initTemplateMenuItemTestDatabase(testContext: DatabaseTestContext): Promise<Template[]>{
        throw new NotImplementedException();
    }

    public async cleanupTemplateMenuItemTestDatabase(testContext: DatabaseTestContext): Promise<Template[]>{
        throw new NotImplementedException();
    }
}