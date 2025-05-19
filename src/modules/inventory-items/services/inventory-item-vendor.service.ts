import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
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
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(vendorRepo, vendorBuilder, validator, 'InventoryItemVendorService', requestContextService, logger)}

    async findOneByName(name: string, relations?: Array<keyof InventoryItemVendor>): Promise<InventoryItemVendor | null> {
        return await this.vendorRepo.findOne({ where: { vendorName: name }, relations });
    }
}