import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { CreateInventoryItemSizeDto } from '../dto/create-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../dto/update-inventory-item-size.dto';
import { InventoryItemSizeFactory } from '../factories/inventory-item-size.factory';
import { ServiceBase } from '../../../base/service-base';
import { InventoryItemService } from './inventory-item.service';
import { InventoryItemPackageService } from './inventory-item-package.service';
import { UnitOfMeasureService } from '../../unit-of-measure/services/unit-of-measure.service';

@Injectable()
export class InventoryItemSizeService extends ServiceBase<InventoryItemSize>{
    constructor(
        @InjectRepository(InventoryItemSize)
        private readonly sizeRepo: Repository<InventoryItemSize>,

        private readonly sizeFactory: InventoryItemSizeFactory,
        private readonly itemService: InventoryItemService,
        private readonly packageService: InventoryItemPackageService,
        private readonly unitService: UnitOfMeasureService,

    ){ super(sizeRepo); }

    async create(createDto: CreateInventoryItemSizeDto): Promise<InventoryItemSize | null> {
        const exists = await this.sizeRepo.findOne({
            where: { 
                measureUnit: { id: createDto.unitOfMeasureId },
                packageType: { id: createDto.inventoryPackageTypeId },
                item: { id: createDto.inventoryItemId } 
            }
        });
        if(exists){ return null; }

        const itemSize = this.sizeFactory.createEntityInstance({
            measureUnit: await this.unitService.findOne(createDto.unitOfMeasureId),
            packageType: await this.packageService.findOne(createDto.inventoryPackageTypeId),
            item: await this.itemService.findOne(createDto.inventoryItemId)
        })
        
        return await this.sizeRepo.save(itemSize);
    }
      
    async update(id: number, updateDto: UpdateInventoryItemSizeDto): Promise<InventoryItemSize | null>{
        const toUpdate = await this.findOne(id);
        if(!toUpdate) { return null; }

        if(updateDto.unitOfMeasureId){
            const unit = await this.unitService.findOne(updateDto.unitOfMeasureId);
            if(!unit){ return null; }
            toUpdate.measureUnit = unit;
        }

        if(updateDto.inventoryPackageTypeId){
            const packageType = await this.packageService.findOne(updateDto.inventoryPackageTypeId);
            if(!packageType){ return null; }
            toUpdate.packageType = packageType;
        }
        
        if(updateDto.inventoryItemId){
            const item = await this.itemService.findOne(updateDto.inventoryItemId);
            if(!item){ return null; }
            toUpdate.item = item;
        }

        return await this.sizeRepo.save(toUpdate);
    }

    async findSizesByItemName(name: string, relations?: string[]): Promise<InventoryItemSize[] | null> {
        return await this.sizeRepo.find({
            where: { item: { name } },
            relations
        });
    }
}
