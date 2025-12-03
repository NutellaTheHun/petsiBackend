import { forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { InventoryAreaCountBuilder } from '../builders/inventory-area-count.builder';
import { CreateInventoryAreaCountDto } from '../dto/inventory-area-count/create-inventory-area-count.dto';
import { UpdateInventoryAreaCountDto } from '../dto/inventory-area-count/update-inventory-area-count.dto';
import {
  InventoryAreaCount,
  InventoryAreaCountEntity,
} from '../entities/inventory-area-count.entity';
import { InventoryAreaItem } from '../entities/inventory-area-item.entity';
import { InventoryArea } from '../entities/inventory-area.entity';
import { InventoryAreaItemCreateInTransaction } from '../utils/transactions/inventory-area-item.create.transaction';
import { InventoryAreaItemUpdateInTransaction } from '../utils/transactions/inventory-area-item.update.transaction';
import { InventoryAreaCountValidator } from '../validators/inventory-area-count.validator';

export class InventoryAreaCountService extends ServiceBase<InventoryAreaCountEntity> {
  constructor(
    @InjectRepository(InventoryAreaCount)
    private readonly repo: Repository<InventoryAreaCount>,

    @Inject(forwardRef(() => InventoryAreaCountBuilder))
    builder: InventoryAreaCountBuilder,

    logger: AppLogger,
    requestContextService: RequestContextService,
    @Inject(forwardRef(() => InventoryAreaCountValidator))
    validator: InventoryAreaCountValidator,

    private readonly dataSource: DataSource,
  ) {
    super(
      repo,
      builder,
      'InventoryAreaCountService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateInventoryAreaCountDto,
  ): Promise<InventoryAreaCount> {
    return this.dataSource.transaction(async (manager) => {
      const count = manager.create(InventoryAreaCount, {
        inventoryArea: { id: dto.inventoryAreaId },
      });

      if (dto.itemCountDtos) {
        for (const itemDto of dto.itemCountDtos) {
          if (itemDto.createDto) {
            const item = await InventoryAreaItemCreateInTransaction(manager, {
              parentInventoryCountId: count.id,
              ...itemDto.createDto,
            });
            count.countedItems.push(item);
          } else if (itemDto.updateDto) {
          }
        }
      }
      await manager.save(count);
      // either assign each created item entity, or query final result and return
      return count;
    });
  }

  protected updateEntity(
    entity: InventoryAreaCount,
    dto: UpdateInventoryAreaCountDto,
  ): Promise<InventoryAreaCount> {
    return this.dataSource.transaction(async (manager) => {
      if (dto.inventoryAreaId) {
        entity.inventoryArea = manager.create(InventoryArea, {
          id: dto.inventoryAreaId,
        });
      }

      if (dto.itemCountDtos) {
        const existingItems = await manager.find(InventoryAreaItem, {
          where: { parentInventoryCount: { id: entity.id } },
          relations: ['countedItemSize'],
        });
        const existingMap = new Map(existingItems.map((i) => [i.id, i]));

        for (const nested of dto.itemCountDtos) {
          if (nested.createDto) {
            const newItem = await InventoryAreaItemCreateInTransaction(
              manager,
              nested.createDto,
            );
            existingMap.set(newItem.id, newItem);
          } else if (nested.id && nested.updateDto) {
            const item = existingMap.get(nested.id);
            if (!item) {
              throw new Error(`Item ${nested.id} not found`);
            }
            const updatedItem = await InventoryAreaItemUpdateInTransaction(
              manager,
              item,
              nested.updateDto,
            );
            existingMap.set(updatedItem.id, updatedItem);
          } else {
            throw new Error(
              'nested dto doesnt have a create DTO or a id and update DTO combination',
            );
          }
        }

        entity.countedItems = Array.from(existingMap.values());
      }

      manager.save(entity);
      return entity;
    });
  }

  async findByAreaName(
    name: string,
    relations?: Array<keyof InventoryAreaCount>,
  ): Promise<InventoryAreaCount[]> {
    return await this.repo.find({
      where: { inventoryArea: { areaName: name } },
      relations,
    });
  }

  /**
   * finds all counts for the given day of date, ignores time.
   */
  async findByDate(
    date: Date,
    relations?: Array<keyof InventoryAreaCount>,
  ): Promise<InventoryAreaCount[]> {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return await this.repo.find({
      where: {
        countDate: Between(startOfDay, endOfDay),
      },
      relations,
    });
  }

  protected applySearch(
    query: SelectQueryBuilder<InventoryAreaCount>,
    search: string,
  ): void {
    //query.distinct(true);

    query
      .leftJoin('entity.countedItems', 'areaItem')
      .leftJoin('areaItem.countedItem', 'inventoryItem')
      .andWhere('(LOWER(inventoryItem.itemName) LIKE :search)', {
        search: `%${search.toLowerCase()}%`,
      });
  }

  protected applyFilters(
    query: SelectQueryBuilder<InventoryAreaCount>,
    filters: Record<string, string[]>,
  ): void {
    if (filters.inventoryArea && filters.inventoryArea.length > 0) {
      query.andWhere('entity.inventoryArea IN (:...inventoryAreas)', {
        inventoryAreas: filters.inventoryArea,
      });
    }
  }

  protected applyDate(
    query: SelectQueryBuilder<InventoryAreaCount>,
    startDate: string,
    endDate?: string,
    dateBy?: string,
  ): void {
    query.andWhere(`DATE(entity.countDate) >= :startDate`, { startDate });

    if (endDate) {
      query.andWhere(`DATE(entity.countDate) <= :endDate`, { endDate });
    }
  }

  protected applySortBy(
    query: SelectQueryBuilder<InventoryAreaCount>,
    sortBy: string,
    sortOrder?: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'countDate') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    } else if (sortBy === 'inventoryArea') {
      query.leftJoinAndSelect('entity.inventoryArea', 'area');
      query.orderBy(`area.areaName`, sortOrder);
    }
  }
}
