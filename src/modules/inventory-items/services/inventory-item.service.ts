import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
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
  ){ super(itemRepo, itemBuilder, validator, 'InventoryItemService')}

  async findOneByName(name: string, relations?: Array<keyof InventoryItem>): Promise<InventoryItem | null> {
    return await this.itemRepo.findOne({ where: { name: name }, relations: relations });
  }
}