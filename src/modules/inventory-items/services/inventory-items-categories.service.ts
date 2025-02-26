import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { UpdateInventoryItemCategoryDto } from '../dto/update-inventory-item-category.dto';
import { CreateInventoryItemCategoryDto } from '../dto/create-inventory-item-category.dto';
import { InventoryItemCategoryFactory } from '../factories/inventory-item-category.factory';
import { ServiceBase } from '../../../base/service-base';

@Injectable()
export class InventoryItemCategoriesService extends ServiceBase<InventoryItemCategory> {
    constructor(
        @InjectRepository(InventoryItemCategory)
        private readonly categoryRepo: Repository<InventoryItemCategory>,
    
        private readonly categoryFactory: InventoryItemCategoryFactory
    
    ){ super(categoryRepo); }

    async create(createDto: CreateInventoryItemCategoryDto)/*: Promise< | null> */{

    }
    
    async update(id: number, updateDto: UpdateInventoryItemCategoryDto)/*: Promise< | null>*/{

    }
    
    async findOneByName(Name: string, relations?: string[])/*: Promise< | null>*/ {

    }
}
