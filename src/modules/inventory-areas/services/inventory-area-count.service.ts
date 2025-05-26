import { forwardRef, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Repository, SelectQueryBuilder } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { InventoryAreaCountBuilder } from "../builders/inventory-area-count.builder";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";

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
        private readonly repo: Repository<InventoryAreaCount>,

        @Inject(forwardRef(() => InventoryAreaCountBuilder))
        builder: InventoryAreaCountBuilder,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) { super(repo, builder, 'InventoryAreaCountService', requestContextService, logger); }

    async findByAreaName(name: string, relations?: Array<keyof InventoryAreaCount>): Promise<InventoryAreaCount[]> {
        return await this.repo.find({
            where: { inventoryArea: { areaName: name } },
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

        return await this.repo.find({
            where: {
                countDate: Between(startOfDay, endOfDay),
            },
            relations,
        });
    }

    protected applySearch(query: SelectQueryBuilder<InventoryAreaCount>, search: string): void {

        //query.distinct(true);

        query
            .leftJoin('entity.countedItems', 'areaItem')
            .leftJoin('areaItem.countedItem', 'inventoryItem')
            .andWhere('(LOWER(inventoryItem.itemName) LIKE :search)', {
                search: `%${search.toLowerCase()}%`,
            });
    }

    protected applyFilters(query: SelectQueryBuilder<InventoryAreaCount>, filters: Record<string, string>): void {
        if (filters.inventoryArea) {
            query.andWhere('entity.inventoryArea = :inventoryArea', { inventoryArea: filters.inventoryArea });
        }
    }

    protected applyDate(query: SelectQueryBuilder<InventoryAreaCount>, startDate: string, endDate?: string, dateBy?: string): void {

        query.andWhere(`DATE(entity.countDate) >= :startDate`, { startDate });

        if (endDate) {
            query.andWhere(`DATE(entity.countDate) <= :endDate`, { endDate });
        }
    }

}