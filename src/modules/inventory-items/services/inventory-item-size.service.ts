import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { InventoryItemSizeBuilder } from '../builders/inventory-item-size.builder';
import { CreateInventoryItemSizeDto } from '../dto/create-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../dto/update-inventory-item-size.dto';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { InventoryItemSizeFactory } from '../factories/inventory-item-size.factory';

@Injectable()
export class InventoryItemSizeService extends ServiceBase<InventoryItemSize>{
    constructor(
        @InjectRepository(InventoryItemSize)
        private readonly sizeRepo: Repository<InventoryItemSize>,

        @Inject(forwardRef(() => InventoryItemSizeFactory))
        private readonly sizeFactory: InventoryItemSizeFactory,
        private readonly sizeBuilder: InventoryItemSizeBuilder,
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

        const itemSize = await this.sizeBuilder.buildCreateDto(createDto);
        
        return await this.sizeRepo.save(itemSize);
    }
      
    async update(id: number, updateDto: UpdateInventoryItemSizeDto): Promise<InventoryItemSize | null>{
        const toUpdate = await this.findOne(id);
        if(!toUpdate) { return null; }

        await this.sizeBuilder.buildUpdateDto(toUpdate, updateDto);

        return await this.sizeRepo.save(toUpdate);
    }

    async findSizesByItemName(name: string, relations?: string[]): Promise<InventoryItemSize[] | null> {
        return await this.sizeRepo.find({
            where: { item: { name } },
            relations
        });
    }

    /**
     *  Depends on UnitOfMeasureService, InventoryItemPackageService, InventoryItemService
     */ 
    async initializeTestingDatabase(): Promise<void> {
        const testingSizes = await this.sizeFactory.getTestingItemSizes();

        for(const size of testingSizes){
            await this.create(
                this.sizeFactory.createDtoInstance({
                unitOfMeasureId: size.measureUnit.id,
                inventoryPackageTypeId: size.packageType.id,
                inventoryItemId: size.item.id,
            }))
        }
    }
}
