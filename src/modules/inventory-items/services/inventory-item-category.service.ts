import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { UpdateInventoryItemCategoryDto } from '../dto/update-inventory-item-category.dto';
import { CreateInventoryItemCategoryDto } from '../dto/create-inventory-item-category.dto';
import { InventoryItemCategoryFactory } from '../factories/inventory-item-category.factory';
import { ServiceBase } from '../../../base/service-base';
import { InventoryItemService } from './inventory-item.service';

@Injectable()
export class InventoryItemCategoryService extends ServiceBase<InventoryItemCategory> {
    constructor(
        @InjectRepository(InventoryItemCategory)
        private readonly categoryRepo: Repository<InventoryItemCategory>,

        @Inject(forwardRef(() => InventoryItemService))
        private readonly itemService: InventoryItemService,

        private readonly categoryFactory: InventoryItemCategoryFactory,
    ){ super(categoryRepo); }

    async create(createDto: CreateInventoryItemCategoryDto): Promise<InventoryItemCategory | null> {
        const exists = await this.findOneByName(createDto.name);
        if(exists){ return null; }

        const category = this.categoryFactory.createEntityInstance({
            name: createDto.name,
            items: await this.itemService.findEntitiesById(createDto.inventoryItemIds),
        })

        return await this.categoryRepo.save(category);
    }
    
    async update(id: number, updateDto: UpdateInventoryItemCategoryDto): Promise<InventoryItemCategory | null>{
        const toUpdate = await this.findOne(id);
        if(!toUpdate) { return null; }

        if(updateDto.name){
            toUpdate.name = updateDto.name;
        }

        if(updateDto.inventoryItemIds){
            toUpdate.items = await this.itemService.findEntitiesById(updateDto.inventoryItemIds);
        }

        return await this.categoryRepo.save(toUpdate);
    }
    
    async findOneByName(name: string, relations?: string[]): Promise<InventoryItemCategory | null> {
        return await this.categoryRepo.findOne({ where: { name: name }, relations });
    }
}
