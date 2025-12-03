import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
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
import { InventoryItemSizeCreateInTransaction } from '../utils/transactions/inventory-item-size.create.transaction';
import { InventoryItemSizeUpdateInTransaction } from '../utils/transactions/inventory-item-size.update.transaction';
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

    private readonly dataSource: DataSource,
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
  ): Promise<InventoryItem> {
    return this.dataSource.transaction(async (manager) => {
      let itemSizes: InventoryItemSize[] = [];
      if (dto.itemSizeDtos) {
        for (const nestedDto of dto.itemSizeDtos) {
          if (nestedDto.createDto) {
            const newSize = await InventoryItemSizeCreateInTransaction(
              manager,
              nestedDto.createDto,
            );
            itemSizes.push(newSize);
          } else {
            throw new Error(
              "InventoryItemSize NestedDto for InventoryItem create request doesn't have a createDto",
            );
          }
        }
      }

      const result = manager.create(InventoryItem, {
        itemName: dto.itemName,
        category: { id: dto.inventoryItemCategoryId },
        vendor: { id: dto.vendorId },
        itemSizes: itemSizes,
      });

      manager.save(result);
      return result;
    });
  }

  protected async updateEntity(
    entity: InventoryItem,
    dto: UpdateInventoryItemDto,
  ): Promise<InventoryItem> {
    return this.dataSource.transaction(async (manager) => {
      if (dto.inventoryItemCategoryId) {
        const newCategory = manager.create(InventoryItemCategory, {
          id: dto.inventoryItemCategoryId,
        });
        entity.category = newCategory;
      }
      if (dto.itemName) {
        entity.itemName = dto.itemName;
      }
      if (dto.itemSizeDtos) {
        const existingSizes = await manager.find(InventoryItemSize, {
          where: { inventoryItem: { id: entity.id } },
        });
        const existingMap = new Map(existingSizes.map((i) => [i.id, i]));

        for (const nestedDto of dto.itemSizeDtos) {
          if (nestedDto.createDto) {
            const newSize = await InventoryItemSizeCreateInTransaction(
              manager,
              nestedDto.createDto,
            );
            existingMap.set(newSize.id, newSize);
          } else if (nestedDto.updateDto && nestedDto.id) {
            const toUpdate = existingMap.get(nestedDto.id);
            if (!toUpdate) {
              throw new Error(
                `InventoryItemSize with id ${nestedDto.id} not found`,
              );
            }
            const updatedSize = await InventoryItemSizeUpdateInTransaction(
              manager,
              toUpdate,
              nestedDto.updateDto,
            );
            existingMap.set(nestedDto.id, updatedSize);
          }
        }
      }
      if (dto.vendorId) {
        const newVendor = manager.create(InventoryItemVendor, {
          id: dto.vendorId,
        });
        entity.vendor = newVendor;
      }
      await manager.save(entity);
      return entity;
    });
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
