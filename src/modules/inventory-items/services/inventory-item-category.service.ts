import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { InventoryItemCategoryBuilder } from '../builders/inventory-item-category.builder';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { InventoryItemCategoryValidator } from '../validators/inventory-item-category.validator';

@Injectable()
export class InventoryItemCategoryService extends ServiceBase<InventoryItemCategory> {
    constructor(
        @InjectRepository(InventoryItemCategory)
        private readonly categoryRepo: Repository<InventoryItemCategory>,
        categoryBuilder: InventoryItemCategoryBuilder,
        validator: InventoryItemCategoryValidator,
    ){ super(categoryRepo, categoryBuilder, validator, 'InventoryItemCategoryService'); }
    
    async findOneByName(name: string, relations?: Array<keyof InventoryItemCategory>): Promise<InventoryItemCategory | null> {
        return await this.categoryRepo.findOne({ where: { name: name }, relations });
    }
}