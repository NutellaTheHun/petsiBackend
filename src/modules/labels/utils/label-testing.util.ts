import { Injectable } from "@nestjs/common";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { LabelType } from "../entities/label-type.entity";
import { Label } from "../entities/label.entity";
import { LabelTypeService } from "../services/label-type.service";
import { LabelService } from "../services/label.service";
import { getTestImageUrls, getTestLabelTypeNames } from "./constants";
import { MenuItemTestingUtil } from "../../menu-items/utils/menu-item-testing.util";

@Injectable()
export class LabelTestingUtil{
    constructor(
        private readonly labelService: LabelService,
        private readonly typeService: LabelTypeService,

        private readonly menuItemTestUtil: MenuItemTestingUtil,
        private readonly itemService: MenuItemService,
    ){ }

    // Label Types
    public async getTestLabelTypeEntities(testContext: DatabaseTestContext): Promise<LabelType[]> {
        const names = getTestLabelTypeNames();
        const results: LabelType[] = [];

        for(const name of names){
            results.push({
                labelTypeName: name,
                labelTypeLength: 200,
                labelTypeWidth: 400,
            } as LabelType);
        }

        return results;
    }

    public async initLabelTypeTestDatabase(testContext: DatabaseTestContext): Promise<void> {
        const types = await this.getTestLabelTypeEntities(testContext);
        testContext.addCleanupFunction(() => this.cleanupLabelTypeTestDatabase());

        await this.typeService.insertEntities(types);
    }

    public async cleanupLabelTypeTestDatabase(): Promise<void> {
        await this.typeService.getQueryBuilder().delete().execute();
    }

    // Label
    public async getTestLabelEntities(testContext: DatabaseTestContext): Promise<Label[]> {
        await this.initLabelTypeTestDatabase(testContext);
        const typesRequest = await this.typeService.findAll();
        const types = typesRequest.items;
        if(!types){ throw new Error(); }
        let typeIdx = 0;

        const urls = getTestImageUrls();

        await this.menuItemTestUtil.initMenuItemTestDatabase(testContext);
        const itemsRequest = await this.itemService.findAll();
        const items = itemsRequest.items;
        if(!items){ throw new Error(); }
        let itemIdx = 0;

        const results: Label[] = [];

        for(const url of urls){
            results.push({
                menuItem: items[itemIdx++ % items.length],
                imageUrl: url,
                labelType: types[typeIdx++ % types.length],
            } as Label);
        }

        return results;
    }

    public async initLabelTestDatabase(testContext: DatabaseTestContext): Promise<void> {
        const labels = await this.getTestLabelEntities(testContext);
        testContext.addCleanupFunction(() => this.cleanupLabelTestDatabase());

        await this.labelService.insertEntities(labels);
    }

    public async cleanupLabelTestDatabase(): Promise<void> {
        await this.labelService.getQueryBuilder().delete().execute();
    }
}