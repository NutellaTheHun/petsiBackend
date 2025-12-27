import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { InventoryItemService } from '../../inventory-items/services/inventory-item.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { InventoryAreaItemBuilder } from '../builders/inventory-area-item.builder';
import { CreateInventoryAreaItemDto } from '../dto/inventory-area-item/create-inventory-area-item.dto';
import { UpdateInventoryAreaItemDto } from '../dto/inventory-area-item/update-inventory-area-item.dto';
import {
  InventoryAreaItem,
  InventoryAreaItemEntity,
} from '../entities/inventory-area-item.entity';
import { InventoryAreaItemCreateInTransaction } from '../utils/transactions/inventory-area-item.create.transaction';
import { InventoryAreaItemUpdateInTransaction } from '../utils/transactions/inventory-area-item.update.transaction';
import { InventoryAreaItemValidator } from '../validators/inventory-area-item.validator';

@Injectable()
export class InventoryAreaItemService extends ServiceBase<InventoryAreaItemEntity> {
  constructor(
    @InjectRepository(InventoryAreaItem)
    private readonly repo: Repository<InventoryAreaItem>,

    @Inject(forwardRef(() => InventoryAreaItemBuilder))
    builder: InventoryAreaItemBuilder,

    @Inject(forwardRef(() => InventoryItemService))
    private readonly itemService: InventoryItemService,

    logger: AppLogger,
    requestContextService: RequestContextService,

    @Inject(forwardRef(() => InventoryAreaItemValidator))
    validator: InventoryAreaItemValidator,
  ) {
    super(
      repo,
      builder,
      'InventoryAreaItemService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateInventoryAreaItemDto,
    manager: EntityManager,
  ): Promise<InventoryAreaItem> {
    const result = await InventoryAreaItemCreateInTransaction(dto, manager);
    return result;
  }
  protected async updateEntity(
    dto: UpdateInventoryAreaItemDto,
    manager: EntityManager,
    entity: InventoryAreaItem,
  ): Promise<void> {
    await InventoryAreaItemUpdateInTransaction(dto, manager, entity);
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
      where: { countedInventoryItem: { id: item.id } },
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

  protected applyFilters(
    query: SelectQueryBuilder<InventoryAreaItem>,
    filters: Record<string, string[]>,
  ): void {
    if (filters.inventoryAreaCount && filters.inventoryAreaCount.length > 0) {
      query.andWhere(
        'entity.parentInventoryCount IN (:...inventoryAreaCounts)',
        {
          inventoryAreaCounts: filters.inventoryAreaCount,
        },
      );
    }
  }
}
