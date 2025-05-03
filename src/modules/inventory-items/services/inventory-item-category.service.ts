import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { InventoryItemCategoryBuilder } from '../builders/inventory-item-category.builder';
import { CreateInventoryItemCategoryDto } from '../dto/create-inventory-item-category.dto';
import { UpdateInventoryItemCategoryDto } from '../dto/update-inventory-item-category.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';

@Injectable()
export class InventoryItemCategoryService extends ServiceBase<InventoryItemCategory> {
    constructor(
        @InjectRepository(InventoryItemCategory)
        private readonly categoryRepo: Repository<InventoryItemCategory>,
        private readonly categoryBuilder: InventoryItemCategoryBuilder,
    ){ super(categoryRepo, 'InventoryItemCategoryService'); }

    async create(createDto: CreateInventoryItemCategoryDto): Promise<InventoryItemCategory | null> {
        const exists = await this.findOneByName(createDto.name);
        if(exists){ return null; }

        const category = await this.categoryBuilder.buildCreateDto(createDto);
        return await this.categoryRepo.save(category);
    }
    
    async update(id: number, updateDto: UpdateInventoryItemCategoryDto): Promise<InventoryItemCategory | null>{
        const toUpdate = await this.findOne(id);
        if(!toUpdate) { return null; }

        await this.categoryBuilder.buildUpdateDto(toUpdate, updateDto);
        return await this.categoryRepo.save(toUpdate);
    }
    
    async findOneByName(name: string, relations?: Array<keyof InventoryItemCategory>): Promise<InventoryItemCategory | null> {
        return await this.categoryRepo.findOne({ where: { name: name }, relations });
    }
}