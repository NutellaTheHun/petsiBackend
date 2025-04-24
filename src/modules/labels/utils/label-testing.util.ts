import { Injectable, NotImplementedException } from "@nestjs/common";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { Label } from "../entities/label.entity";
import { LabelService } from "../services/label.service";
import { MenuItemService } from "../../menu-items/services/menu-item.service";

@Injectable()
export class LabelTestingUtil{
    constructor(
        private readonly labelService: LabelService,
        private readonly itemService: MenuItemService,
    ){ }

    public async getTestLabelEntities(testContext: DatabaseTestContext): Promise<Label[]> {
        throw new NotImplementedException();
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