import { forwardRef, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { AppLogger } from "../../app-logging/app-logger";
import { InventoryAreaItemBuilder } from "../builders/inventory-area-item.builder";
import { InventoryAreaItem } from "../entities/inventory-area-item.entity";
import { InventoryAreaItemValidator } from "../validators/inventory-area-item.validator";

export class InventoryAreaItemService extends ServiceBase<InventoryAreaItem> {
    constructor(
        @InjectRepository(InventoryAreaItem)
        private readonly itemCountRepo: Repository<InventoryAreaItem>,

        @Inject(forwardRef(() => InventoryAreaItemBuilder))
        itemCountBuilder: InventoryAreaItemBuilder,

        validator: InventoryAreaItemValidator,

        logger: AppLogger,
        private readonly itemService: InventoryItemService,
        requestContextService: RequestContextService,
    ){ super(itemCountRepo, itemCountBuilder, validator, 'InventoryAreaItemService', requestContextService, logger); }

    async findByItemName(name: string, relations?: Array<keyof InventoryAreaItem>): Promise<InventoryAreaItem[]> {
        const item = await this.itemService.findOneByName(name);
        if(!item){ throw new Error('inventory item not found'); }

        return await this.itemCountRepo.find({ 
            where: { item: { id: item.id } }, 
            relations
        });
    }
}