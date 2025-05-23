import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { InventoryItemSizeBuilder } from '../builders/inventory-item-size.builder';
import { CreateInventoryItemSizeDto } from '../dto/inventory-item-size/create-inventory-item-size.dto';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { InventoryItem } from '../entities/inventory-item.entity';

@Injectable()
export class InventoryItemSizeService extends ServiceBase<InventoryItemSize> {
    constructor(
        @InjectRepository(InventoryItemSize)
        private readonly reop: Repository<InventoryItemSize>,

        @Inject(forwardRef(() => InventoryItemSizeBuilder))
        builder: InventoryItemSizeBuilder,
        
        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(reop, builder, 'InventoryItemSizeService', requestContextService, logger); }

    /**
     * Depreciated, only created as a child through {@link InventoryItem}.
     */
    public async create(dto: CreateInventoryItemSizeDto): Promise<InventoryItemSize> {
        throw new BadRequestException();
    }


    async findSizesByItemName(name: string, relations?: Array<keyof InventoryItemSize>): Promise<InventoryItemSize[] | null> {
        return await this.reop.find({
            where: { inventoryItem: { itemName: name } },
            relations
        });
    }
}