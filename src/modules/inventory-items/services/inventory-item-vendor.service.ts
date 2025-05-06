import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { InventoryItemVendorBuilder } from '../builders/inventory-item-vendor.builder';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { InventoryItemVendorValidator } from '../validators/inventory-item-vendor.validator';

@Injectable()
export class InventoryItemVendorService extends ServiceBase<InventoryItemVendor>{
    constructor(
        @InjectRepository(InventoryItemVendor)
        private readonly vendorRepo: Repository<InventoryItemVendor>,
        vendorBuilder: InventoryItemVendorBuilder,
        validator: InventoryItemVendorValidator,
    ){ super(vendorRepo, vendorBuilder, validator, 'InventoryItemVendorService')}

    async findOneByName(name: string, relations?: Array<keyof InventoryItemVendor>): Promise<InventoryItemVendor | null> {
        return await this.vendorRepo.findOne({ where: { name: name }, relations });
    }
}