import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryAreaItemDto } from '../dto/inventory-area-item/create-inventory-area-item.dto';
import { UpdateInventoryAreaItemDto } from '../dto/inventory-area-item/update-inventory-area-item.dto';
import {
  InventoryAreaItem,
  InventoryAreaItemEntity,
} from '../entities/inventory-area-item.entity';
import { InventoryAreaItemComposer } from '../utils/composers/inventory-area-item.composer';
import { InventoryAreaItemValidator } from '../validators/inventory-area-item.validator';

@Injectable()
export class InventoryAreaItemService extends ServiceBase<InventoryAreaItemEntity> {
  constructor(
    @InjectRepository(InventoryAreaItem)
    repo: Repository<InventoryAreaItem>,
    logger: AppLogger,
    requestContextService: RequestContextService,
    @Inject(forwardRef(() => InventoryAreaItemValidator))
    validator: InventoryAreaItemValidator,

    private readonly areaItemComposer: InventoryAreaItemComposer,
  ) {
    super(
      repo,
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
    return await manager.save(
      await this.areaItemComposer.composeCreate(dto, manager),
    );
  }
  protected async updateEntity(
    dto: UpdateInventoryAreaItemDto,
    manager: EntityManager,
    entity: InventoryAreaItem,
  ): Promise<void> {
    await manager.save(
      await this.areaItemComposer.composeUpdate(dto, manager, entity),
    );
  }

  protected applySortBy(
    query: SelectQueryBuilder<InventoryAreaItem>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'countedInventoryItem') {
      query.leftJoinAndSelect('entity.countedInventoryItem', 'inventoryItem');
      query.orderBy(`inventoryItem.name`, sortOrder);
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
      .leftJoin('entity.countedInventoryItem', 'inventoryItem')
      .andWhere('(LOWER(inventoryItem.name) LIKE :search)', {
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
