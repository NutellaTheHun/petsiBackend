import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { InventoryItemBuilder } from '../builders/inventory-item.builder';
import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryItemValidator } from '../validators/inventory-item.validator';

@Injectable()
export class InventoryItemService extends ServiceBase<InventoryItem> {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly itemRepo: Repository<InventoryItem>,
    itemBuilder: InventoryItemBuilder,
    validator:InventoryItemValidator,
    requestContextService: RequestContextService,
    logger: AppLogger,
  ){ super(itemRepo, itemBuilder, validator, 'InventoryItemService', requestContextService, logger)}

  async findOneByName(name: string, relations?: Array<keyof InventoryItem>): Promise<InventoryItem | null> {
    return await this.itemRepo.findOne({ where: { name: name }, relations: relations });
  }
}