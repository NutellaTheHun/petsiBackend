import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { InventoryItemSizeBuilder } from '../builders/inventory-item-size.builder';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';

@Injectable()
export class InventoryItemSizeService extends ServiceBase<InventoryItemSize> {
  constructor(
    @InjectRepository(InventoryItemSize)
    private readonly reop: Repository<InventoryItemSize>,

    @Inject(forwardRef(() => InventoryItemSizeBuilder))
    builder: InventoryItemSizeBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      reop,
      builder,
      'InventoryItemSizeService',
      requestContextService,
      logger,
    );
  }

  async findSizesByItemName(
    name: string,
    relations?: Array<keyof InventoryItemSize>,
  ): Promise<InventoryItemSize[] | null> {
    return await this.reop.find({
      where: { inventoryItem: { itemName: name } },
      relations,
    });
  }

  protected applySortBy(
    query: SelectQueryBuilder<InventoryItemSize>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'cost') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }
}
