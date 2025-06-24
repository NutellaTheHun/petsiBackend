import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
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
  ) {
    super(repo, builder, 'InventoryItemService', requestContextService, logger);
  }

  async findOneByName(
    name: string,
    relations?: Array<keyof InventoryItem>,
  ): Promise<InventoryItem | null> {
    return await this.repo.findOne({
      where: { itemName: name },
      relations: relations,
    });
  }

  protected applySearch(
    query: SelectQueryBuilder<InventoryItem>,
    search: string,
  ): void {
    query.andWhere('(LOWER(entity.itemName) LIKE :search)', {
      search: `%${search.toLowerCase()}%`,
    });
  }

  protected applyFilters(
    query: SelectQueryBuilder<InventoryItem>,
    filters: Record<string, string[]>,
  ): void {
    if (filters.category && filters.category.length > 0) {
      query.andWhere('entity.category IN (:...categories)', {
        categories: filters.category,
      });
    }

    if (filters.vendor && filters.vendor.length > 0) {
      query.andWhere('entity.vendor IN (:...vendors)', {
        vendors: filters.vendor,
      });
    }
    //filter for no category?

    // filter for no vendor?
  }

  protected applySortBy(
    query: SelectQueryBuilder<InventoryItem>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'itemName') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    } else if (sortBy === 'vendor') {
      query.leftJoinAndSelect('entity.vendor', 'vendor');
      query.orderBy('vendor.vendorName', sortOrder, 'NULLS LAST');
    } else if (sortBy === 'category') {
      query.leftJoinAndSelect('entity.category', 'category');
      query.orderBy('category.categoryName', sortOrder, 'NULLS LAST');
    }
  }
}
