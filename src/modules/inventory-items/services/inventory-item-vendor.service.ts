import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { CreateInventoryItemVendorDto } from '../dto/create-inventory-item-vendor.dto';
import { UpdateInventoryItemVendorDto } from '../dto/update-inventory-item-vendor.dto';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { InventoryItemVendorFactory } from '../factories/inventory-item-vendor.factory';
import { InventoryItemService } from './inventory-item.service';
import { InventoryItemVendorBuilder } from '../builders/inventory-item-vendor.builder';

@Injectable()
export class InventoryItemVendorService extends ServiceBase<InventoryItemVendor>{
    constructor(
        @InjectRepository(InventoryItemVendor)
        private readonly vendorRepo: Repository<InventoryItemVendor>,

        private readonly vendorFactory: InventoryItemVendorFactory,

        @Inject(forwardRef(() => InventoryItemService))
        private readonly itemService: InventoryItemService,

        private readonly vendorBuilder: InventoryItemVendorBuilder,
    
    ){ super(vendorRepo)}

    async create(createDto: CreateInventoryItemVendorDto): Promise<InventoryItemVendor | null> {
        const exists = await this.findOneByName(createDto.name);
        if(exists) {return null; }

        const vendor = await this.vendorBuilder.buildCreateDto(createDto);

        return await this.vendorRepo.save(vendor);
    }
      
    async update(id: number, updateDto: UpdateInventoryItemVendorDto): Promise<InventoryItemVendor | null>{
        const toUpdate = await this.findOne(id);
        if(!toUpdate) {return null; }

        await this.vendorBuilder.buildUpdateDto(toUpdate, updateDto);

        return await this.vendorRepo.save(toUpdate);
    }

    async findOneByName(name: string, relations?: string[]): Promise<InventoryItemVendor | null> {
        return await this.vendorRepo.findOne({ where: { name: name }, relations });
    }

    async initializeTestingDatabase(): Promise<void>{
        const vendors = this.vendorFactory.getTestingVendors();
        for(const vendor of vendors){
            await this.create(
                this.vendorFactory.createDtoInstance({ name: vendor.name })
            )
          }
    }
}