import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { InventoryItemVendorBuilder } from '../builders/inventory-item-vendor.builder';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';

@Injectable()
export class InventoryItemVendorService extends ServiceBase<InventoryItemVendor> {
    constructor(
        @InjectRepository(InventoryItemVendor)
        private readonly repo: Repository<InventoryItemVendor>,

        builder: InventoryItemVendorBuilder,

        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(repo, builder, 'InventoryItemVendorService', requestContextService, logger) }

    async findOneByName(name: string, relations?: Array<keyof InventoryItemVendor>): Promise<InventoryItemVendor | null> {
        return await this.repo.findOne({ where: { vendorName: name }, relations });
    }

    protected applySortBy(query: SelectQueryBuilder<InventoryItemVendor>, sortBy: string, sortOrder: "ASC" | "DESC"): void {
        if (sortBy === 'vendorName') {
            query.orderBy(`entity.${sortBy}`, sortOrder);
        }
    }
}
