import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { InventoryItemBuilder } from '../builders/inventory-item.builder';
import { InventoryItem } from '../entities/inventory-item.entity';

@Injectable()
export class InventoryItemService extends ServiceBase<InventoryItem> {
    constructor(
        @InjectRepository(InventoryItem)
        private readonly repo: Repository<InventoryItem>,

        builder: InventoryItemBuilder,
        
        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(repo, builder, 'InventoryItemService', requestContextService, logger) }

    async findOneByName(name: string, relations?: Array<keyof InventoryItem>): Promise<InventoryItem | null> {
        return await this.repo.findOne({ where: { itemName: name }, relations: relations });
    }
}