import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { InventoryItemBuilder } from '../builders/inventory-item.builder';
import { CreateInventoryItemDto } from '../dto/inventory-item/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/inventory-item/update-inventory-item.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import {
  InventoryItem,
  InventoryItemEntity,
} from '../entities/inventory-item.entity';
import { InventoryItemSizeComposer } from '../utils/composers/inventory-item-size.composer';
import { InventoryItemValidator } from '../validators/inventory-item.validator';

@Injectable()
export class InventoryItemService extends ServiceBase<InventoryItemEntity> {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly repo: Repository<InventoryItem>,

    @Inject(forwardRef(() => InventoryItemBuilder))
    builder: InventoryItemBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,

    @Inject(forwardRef(() => InventoryItemValidator))
    validator: InventoryItemValidator,

    private readonly itemSizeComposer: InventoryItemSizeComposer,
  ) {
    super(
      repo,
      builder,
      'InventoryItemService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateInventoryItemDto,
    manager: EntityManager,
  ): Promise<InventoryItem> {
    const result = manager.create(InventoryItem, {
      name: dto.name,

      ...(dto.categoryId && {
        category: { id: dto.categoryId },
      }),

      ...(dto.vendorId && { vendor: { id: dto.vendorId } }),
    });

    if (dto.sizes?.length) {
      result.sizes = await this.itemSizeComposer.composeManyNestedEntity(
        dto.sizes,
        manager,
        [],
        { inventoryItemId: result.id },
      );
    }

    return await manager.save(result);
  }

  protected async updateEntity(
    dto: UpdateInventoryItemDto,
    manager: EntityManager,
    entity: InventoryItem,
  ): Promise<void> {
    if (dto.categoryId !== undefined) {
      const newCategory = manager.create(InventoryItemCategory, {
        id: dto.categoryId,
      });
      entity.category = newCategory;
    }

    if (dto.name !== undefined) {
      entity.name = dto.name;
    }

    if (dto.vendorId !== undefined) {
      const newVendor = manager.create(InventoryItemVendor, {
        id: dto.vendorId,
      });
      entity.vendor = newVendor;
    }

    if (dto.sizes?.length) {
      const existingSizes = await manager.find(InventoryItemSize, {
        where: { inventoryItem: { id: entity.id } },
      });
      entity.sizes = await this.itemSizeComposer.composeManyNestedEntity(
        dto.sizes,
        manager,
        existingSizes,
      );
    }

    await manager.save(entity);
  }

  async findOneByName(
    name: string,
    relations?: Array<keyof InventoryItem>,
  ): Promise<InventoryItem | null> {
    return await this.repo.findOne({
      where: { name: name },
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
