import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { InventoryItemSizeBuilder } from '../builders/inventory-item-size.builder';
import { CreateInventoryItemSizeDto } from '../dto/create-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../dto/update-inventory-item-size.dto';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { InventoryItemService } from './inventory-item.service';
import { InventoryItemSizeValidator } from '../validators/inventory-item-size.validator';

@Injectable()
export class InventoryItemSizeService extends ServiceBase<InventoryItemSize>{
    constructor(
        @InjectRepository(InventoryItemSize)
        private readonly sizeRepo: Repository<InventoryItemSize>,

        @Inject(forwardRef(() => InventoryItemSizeBuilder))
        private readonly sizeBuilder: InventoryItemSizeBuilder,

        validator: InventoryItemSizeValidator,

        @Inject(forwardRef(() => InventoryItemService))
        private readonly itemService: InventoryItemService,
    ){ super(sizeRepo, sizeBuilder, validator, 'InventoryItemSizeService'); }

    async create(createDto: CreateInventoryItemSizeDto): Promise<InventoryItemSize | null> {
        if(!createDto.inventoryItemId){ throw new Error("inventory id required"); }
        const exists = await this.sizeRepo.findOne({
            where: { 
                measureUnit: { id: createDto.unitOfMeasureId },
                packageType: { id: createDto.inventoryPackageTypeId },
                item: { id: createDto.inventoryItemId } 
            }
        });
        if(exists){ return null; }

        //const parentItem = await this.itemService.findOne(createDto.inventoryItemId);
        //if(!parentItem){ throw new NotFoundException(); }
        const itemSize = await this.sizeBuilder.buildCreateDto(/*parentItem, */createDto);
        return await this.sizeRepo.save(itemSize);
    }
      
    async update(id: number, updateDto: UpdateInventoryItemSizeDto): Promise<InventoryItemSize | null>{
        const toUpdate = await this.findOne(id);
        if(!toUpdate) { return null; }

        await this.sizeBuilder.buildUpdateDto(toUpdate, updateDto);
        return await this.sizeRepo.save(toUpdate);
    }

    async findSizesByItemName(name: string, relations?: Array<keyof InventoryItemSize>): Promise<InventoryItemSize[] | null> {
        return await this.sizeRepo.find({
            where: { item: { name } },
            relations
        });
    }
}