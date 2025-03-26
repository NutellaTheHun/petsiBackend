import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { UpdateInventoryItemCategoryDto } from '../dto/update-inventory-item-category.dto';
import { CreateInventoryItemCategoryDto } from '../dto/create-inventory-item-category.dto';
import { InventoryItemCategoryFactory } from '../factories/inventory-item-category.factory';
import { ServiceBase } from '../../../base/service-base';
import { InventoryItemService } from './inventory-item.service';
import { InventoryItemCategoryBuilder } from '../builders/inventory-item-category.builder';

@Injectable()
export class InventoryItemCategoryService extends ServiceBase<InventoryItemCategory> {
    constructor(
        @InjectRepository(InventoryItemCategory)
        private readonly categoryRepo: Repository<InventoryItemCategory>,

        @Inject(forwardRef(() => InventoryItemService))
        private readonly itemService: InventoryItemService,

        private readonly categoryFactory: InventoryItemCategoryFactory,
        private readonly categoryBuilder: InventoryItemCategoryBuilder,
    ){ super(categoryRepo); }

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
    
    async findOneByName(name: string, relations?: string[]): Promise<InventoryItemCategory | null> {
        return await this.categoryRepo.findOne({ where: { name: name }, relations });
    }
    
    async initializeTestingDatabase(): Promise<void> {
        const categories = this.categoryFactory.getDefaultItemCategories();

        for(const category of categories) {
            await this.create(
                this.categoryFactory.createDtoInstance({ name: category.name })
            )
        }
    }
}
