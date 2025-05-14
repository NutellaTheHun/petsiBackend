import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { InventoryItemSizeBuilder } from '../builders/inventory-item-size.builder';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { InventoryItemSizeValidator } from '../validators/inventory-item-size.validator';

@Injectable()
export class InventoryItemSizeService extends ServiceBase<InventoryItemSize>{
    constructor(
        @InjectRepository(InventoryItemSize)
        private readonly sizeRepo: Repository<InventoryItemSize>,

        @Inject(forwardRef(() => InventoryItemSizeBuilder))
        sizeBuilder: InventoryItemSizeBuilder,
        
        validator: InventoryItemSizeValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(sizeRepo, sizeBuilder, validator, 'InventoryItemSizeService', requestContextService, logger); }

    async findSizesByItemName(name: string, relations?: Array<keyof InventoryItemSize>): Promise<InventoryItemSize[] | null> {
        return await this.sizeRepo.find({
            where: { item: { name } },
            relations
        });
    }
}