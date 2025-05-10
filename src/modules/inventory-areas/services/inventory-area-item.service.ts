import { forwardRef, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
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

        private readonly itemService: InventoryItemService,
    ){ super(itemCountRepo, itemCountBuilder, validator, 'InventoryAreaItemService'); }

    async findByItemName(name: string, relations?: Array<keyof InventoryAreaItem>): Promise<InventoryAreaItem[]> {
        const item = await this.itemService.findOneByName(name);
        if(!item){ throw new Error('inventory item not found'); }

        return await this.itemCountRepo.find({ 
            where: { item: { id: item.id } }, 
            relations
        });
    }
}