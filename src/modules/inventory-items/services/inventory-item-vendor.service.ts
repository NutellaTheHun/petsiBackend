import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ChangeDetectorBase } from '../../../common/base/change-detector.base';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemVendorDto } from '../dto/inventory-item-vendor/create-inventory-item-vendor.dto';
import { UpdateInventoryItemVendorDto } from '../dto/inventory-item-vendor/update-inventory-item-vendor.dto';
import {
  InventoryItemVendor,
  InventoryItemVendorEntity,
} from '../entities/inventory-item-vendor.entity';
import { InventoryItemVendorChangeDetector } from '../utils/change-detectors/inventory-item-vendor.change-detector';
import { InventoryItemVendorValidator } from '../validators/inventory-item-vendor.validator';

@Injectable()
export class InventoryItemVendorService extends ServiceBase<InventoryItemVendorEntity> {
  constructor(
    @InjectRepository(InventoryItemVendor)
    repo: Repository<InventoryItemVendor>,
    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: InventoryItemVendorValidator,
    private readonly inventoryItemVendorChangeDetector: InventoryItemVendorChangeDetector,
  ) {
    super(
      repo,
      'InventoryItemVendorService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateInventoryItemVendorDto,
    manager: EntityManager,
  ): Promise<InventoryItemVendor> {
    const result = manager.create(InventoryItemVendor, {
      name: dto.name,
    });
    return await manager.save(result);
  }

  protected async updateEntity(
    dto: UpdateInventoryItemVendorDto,
    manager: EntityManager,
    entity: InventoryItemVendor,
  ): Promise<void> {
    if (dto.name !== undefined) {
      entity.name = dto.name;
    }
    await manager.save(entity);
  }

  protected applySortBy(
    query: SelectQueryBuilder<InventoryItemVendor>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'name') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }

  protected getChangeDetector():
    | ChangeDetectorBase<InventoryItemVendor, UpdateInventoryItemVendorDto>
    | undefined {
    return this.inventoryItemVendorChangeDetector;
  }
}
