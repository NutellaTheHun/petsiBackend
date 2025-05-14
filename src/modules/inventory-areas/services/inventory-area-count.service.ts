import { forwardRef, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { InventoryAreaCountBuilder } from "../builders/inventory-area-count.builder";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryAreaCountValidator } from "../validators/inventory-area-count.validator";

/**
 * Intended flow of facilitating an inventory count:
 * - select pre-existing inventory area
 * - Create InventoryAreaCount with an InvArea, and empty list of inventoryItemCount
 * - employee performs inventory count, creating list of inventoryItemCount
 * - employee saves/completes/finished inventory count, updateDTO is sent with areaId, countId, and inventoryItemCountDTOs
 * - inventoryItemCountDTOs are created (via separate call to inventoryItemCountController)
 * - with returned list of inventoryItemCountIDs, update areaCount entity with itemIDs
 */
export class InventoryAreaCountService extends ServiceBase<InventoryAreaCount> {
    constructor(
        @InjectRepository(InventoryAreaCount)
        private readonly areaCountRepo: Repository<InventoryAreaCount>,

        @Inject(forwardRef(() => InventoryAreaCountBuilder))
        areaCountBuilder: InventoryAreaCountBuilder,
        logger: AppLogger,
        validator: InventoryAreaCountValidator,
        requestContextService: RequestContextService,
    ){ super(areaCountRepo, areaCountBuilder, validator, 'InventoryAreaCountService', requestContextService, logger); }

    async findByAreaName(name: string, relations?: Array<keyof InventoryAreaCount>): Promise<InventoryAreaCount[]> {
        return await this.areaCountRepo.find({ 
            where: { inventoryArea: { name: name } }, 
            relations
        });
    }

    /**
     * finds all counts for the given day of date, ignores time.
     */
    async findByDate(date: Date, relations?: Array<keyof InventoryAreaCount>): Promise<InventoryAreaCount[]> {
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);

        return await this.areaCountRepo.find({
            where: {
                countDate: Between(startOfDay, endOfDay),
            },
            relations,
        });
    }
}