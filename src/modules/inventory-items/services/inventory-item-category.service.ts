import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { InventoryItemCategoryBuilder } from '../builders/inventory-item-category.builder';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';

@Injectable()
export class InventoryItemCategoryService extends ServiceBase<InventoryItemCategory> {
    constructor(
        @InjectRepository(InventoryItemCategory)
        private readonly repo: Repository<InventoryItemCategory>,

        @Inject(forwardRef(() => InventoryItemCategoryBuilder))
        builder: InventoryItemCategoryBuilder,

        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(repo, builder, 'InventoryItemCategoryService', requestContextService, logger); }

    async findOneByName(name: string, relations?: Array<keyof InventoryItemCategory>): Promise<InventoryItemCategory | null> {
        return await this.repo.findOne({ where: { categoryName: name }, relations });
    }

    protected applySortBy(query: SelectQueryBuilder<InventoryItemCategory>, sortBy: string, sortOrder: "ASC" | "DESC"): void {
        if (sortBy === 'categoryName') {
            query.orderBy(`entity.${sortBy}`, sortOrder);
        }
    }
}