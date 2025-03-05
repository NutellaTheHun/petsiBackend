import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { InventoryItemVendorFactory } from '../factories/inventory-item-vendor.factory';
import { CreateInventoryItemVendorDto } from '../dto/create-inventory-item-vendor.dto';
import { UpdateInventoryItemVendorDto } from '../dto/update-inventory-item-vendor.dto';
import { ServiceBase } from '../../../base/service-base';
import { InventoryItemService } from './inventory-item.service';

@Injectable()
export class InventoryItemVendorService extends ServiceBase<InventoryItemVendor>{
    constructor(
        @InjectRepository(InventoryItemVendor)
        private readonly vendorRepo: Repository<InventoryItemVendor>,

        private readonly vendorFactory: InventoryItemVendorFactory,
        private readonly itemService: InventoryItemService,
    
    ){ super(vendorRepo)}

    async create(createDto: CreateInventoryItemVendorDto): Promise<InventoryItemVendor | null> {
        const exists = await this.findOneByName(createDto.name);
        if(exists) {return null; }

        const vendor = this.vendorFactory.createEntityInstance({
            name: createDto.name,
            items: await this.itemService.findEntitiesById(createDto.inventoryItemIds),
        })

        return await this.vendorRepo.save(vendor);
    }
      
    async update(id: number, updateDto: UpdateInventoryItemVendorDto): Promise<InventoryItemVendor | null>{
        const toUpdate = await this.findOne(id);
        if(!toUpdate) {return null; }

        if(updateDto.name){
            toUpdate.name = updateDto.name;
        }

        if(updateDto.inventoryItemIds){
            toUpdate.items = await this.itemService.findEntitiesById(updateDto.inventoryItemIds);
        }

        return await this.vendorRepo.save(toUpdate);
    }

    async findOneByName(name: string, relations?: string[]): Promise<InventoryItemVendor | null> {
        return await this.vendorRepo.findOne({ where: { name: name }, relations });
    }
}