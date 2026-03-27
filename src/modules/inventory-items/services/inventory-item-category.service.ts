import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ChangeDetectorBase } from '../../../common/base/change-detector.base';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemCategoryDto } from '../dto/inventory-item-category/create-inventory-item-category.dto';
import { UpdateInventoryItemCategoryDto } from '../dto/inventory-item-category/update-inventory-item-category.dto';
import {
  InventoryItemCategory,
  InventoryItemCategoryEntity,
} from '../entities/inventory-item-category.entity';
import { InventoryItemCategoryChangeDetector } from '../utils/change-detectors/inventory-item-category.change-detector';
import { InventoryItemCategoryValidator } from '../validators/inventory-item-category.validator';

@Injectable()
export class InventoryItemCategoryService extends ServiceBase<InventoryItemCategoryEntity> {
  constructor(
    @InjectRepository(InventoryItemCategory)
    repo: Repository<InventoryItemCategory>,
    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: InventoryItemCategoryValidator,
    private readonly inventoryItemCategoryChangeDetector: InventoryItemCategoryChangeDetector,
  ) {
    super(
      repo,
      'InventoryItemCategoryService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateInventoryItemCategoryDto,
    manager: EntityManager,
  ): Promise<InventoryItemCategory> {
    const result = manager.create(InventoryItemCategory, {
      name: dto.name,
    });
    return await manager.save(result);
  }

  protected async updateEntity(
    dto: UpdateInventoryItemCategoryDto,
    manager: EntityManager,
    entity: InventoryItemCategory,
  ): Promise<void> {
    if (dto.name !== undefined) {
      entity.name = dto.name;
    }
    await manager.save(entity);
  }

  protected applySortBy(
    query: SelectQueryBuilder<InventoryItemCategory>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'name') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }

  protected getChangeDetector():
    | ChangeDetectorBase<InventoryItemCategory, UpdateInventoryItemCategoryDto>
    | undefined {
    return this.inventoryItemCategoryChangeDetector;
  }
}
