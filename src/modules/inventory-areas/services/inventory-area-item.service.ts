import { BadRequestException, forwardRef, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { AppLogger } from "../../app-logging/app-logger";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { RequestContextService } from "../../request-context/RequestContextService";
import { InventoryAreaItemBuilder } from "../builders/inventory-area-item.builder";
import { CreateInventoryAreaItemDto } from "../dto/inventory-area-item/create-inventory-area-item.dto";
import { InventoryAreaItem } from "../entities/inventory-area-item.entity";
import { InventoryAreaItemValidator } from "../validators/inventory-area-item.validator";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";

export class InventoryAreaItemService extends ServiceBase<InventoryAreaItem> {
    constructor(
        @InjectRepository(InventoryAreaItem)
        private readonly itemCountRepo: Repository<InventoryAreaItem>,

        @Inject(forwardRef(() => InventoryAreaItemBuilder))
        itemCountBuilder: InventoryAreaItemBuilder,

        @Inject(forwardRef(() => InventoryAreaItemValidator))
        validator: InventoryAreaItemValidator,

        logger: AppLogger,
        private readonly itemService: InventoryItemService,
        requestContextService: RequestContextService,
    ){ super(itemCountRepo, itemCountBuilder, validator, 'InventoryAreaItemService', requestContextService, logger); }

    /**
     * Depreciated, only created as a child through {@link InventoryAreaCount}.
     */
    public async create(dto: CreateInventoryAreaItemDto): Promise<InventoryAreaItem> {
        throw new BadRequestException();
    }

    async findByItemName(name: string, relations?: Array<keyof InventoryAreaItem>): Promise<InventoryAreaItem[]> {
        const item = await this.itemService.findOneByName(name);
        if(!item){ throw new Error('inventory item not found'); }

        return await this.itemCountRepo.find({ 
            where: { countedItem: { id: item.id } }, 
            relations
        });
    }
}