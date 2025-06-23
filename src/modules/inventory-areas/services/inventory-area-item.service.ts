import { forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { InventoryItemService } from '../../inventory-items/services/inventory-item.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { InventoryAreaItemBuilder } from '../builders/inventory-area-item.builder';
import { InventoryAreaItem } from '../entities/inventory-area-item.entity';

export class InventoryAreaItemService extends ServiceBase<InventoryAreaItem> {
  constructor(
    @InjectRepository(InventoryAreaItem)
    private readonly repo: Repository<InventoryAreaItem>,

    @Inject(forwardRef(() => InventoryAreaItemBuilder))
    builder: InventoryAreaItemBuilder,

    private readonly itemService: InventoryItemService,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(
      repo,
      builder,
      'InventoryAreaItemService',
      requestContextService,
      logger,
    );
  }

  async findByItemName(
    name: string,
    relations?: Array<keyof InventoryAreaItem>,
  ): Promise<InventoryAreaItem[]> {
    const item = await this.itemService.findOneByName(name);
    if (!item) {
      throw new Error('inventory item not found');
    }

    return await this.repo.find({
      where: { countedItem: { id: item.id } },
      relations,
    });
  }

  protected applySortBy(
    query: SelectQueryBuilder<InventoryAreaItem>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'countedItem') {
      query.leftJoinAndSelect('entity.countedItem', 'inventoryItem');
      query.orderBy(`inventoryItem.itemName`, sortOrder);
    }
    if (sortBy === 'amount') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }

  protected applySearch(
    query: SelectQueryBuilder<InventoryAreaItem>,
    search: string,
  ): void {
    query
      .leftJoin('entity.countedItem', 'inventoryItem')
      .andWhere('(LOWER(inventoryItem.itemName) LIKE :search)', {
        search: `%${search.toLowerCase()}%`,
      });
  }
}
