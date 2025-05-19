import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { RequestContextService } from '../../request-context/RequestContextService';
import { AppLogger } from '../../app-logging/app-logger';
import { InventoryItemCategoryBuilder } from '../builders/inventory-item-category.builder';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { InventoryItemCategoryValidator } from '../validators/inventory-item-category.validator';

@Injectable()
export class InventoryItemCategoryService extends ServiceBase<InventoryItemCategory> {
    constructor(
        @InjectRepository(InventoryItemCategory)
        private readonly categoryRepo: Repository<InventoryItemCategory>,

        @Inject(forwardRef(() => InventoryItemCategoryBuilder))
        categoryBuilder: InventoryItemCategoryBuilder,

        validator: InventoryItemCategoryValidator,
        
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(categoryRepo, categoryBuilder, validator, 'InventoryItemCategoryService', requestContextService, logger); }
    
    async findOneByName(name: string, relations?: Array<keyof InventoryItemCategory>): Promise<InventoryItemCategory | null> {
        return await this.categoryRepo.findOne({ where: { categoryName: name }, relations });
    }
}