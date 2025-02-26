import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { InventoryItemVendorFactory } from '../factories/inventory-item-vendor.factory';
import { CreateInventoryItemVendorDto } from '../dto/create-inventory-item-vendor.dto';
import { UpdateInventoryItemVendorDto } from '../dto/update-inventory-item-vendor.dto';
import { ServiceBase } from '../../../base/service-base';

@Injectable()
export class InventoryItemVendorsService extends ServiceBase<InventoryItemVendor>{
    constructor(
        @InjectRepository(InventoryItemVendor)
        private readonly vendorRepo: Repository<InventoryItemVendor>,
    
        private readonly vendorFactory: InventoryItemVendorFactory
    
    ){ super(vendorRepo)}

    async create(createDto: CreateInventoryItemVendorDto)/*: Promise< | null> */{

    }
      
    async update(id: number, updateDto: UpdateInventoryItemVendorDto)/*: Promise< | null>*/{

    }

    async findOneByName(Name: string, relations?: string[])/*: Promise< | null>*/ {

    }
}