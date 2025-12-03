import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { InventoryItemVendorBuilder } from '../builders/inventory-item-vendor.builder';
import { CreateInventoryItemVendorDto } from '../dto/inventory-item-vendor/create-inventory-item-vendor.dto';
import { UpdateInventoryItemVendorDto } from '../dto/inventory-item-vendor/update-inventory-item-vendor.dto';
import {
  InventoryItemVendor,
  InventoryItemVendorEntity,
} from '../entities/inventory-item-vendor.entity';
import { InventoryItemVendorValidator } from '../validators/inventory-item-vendor.validator';

@Injectable()
export class InventoryItemVendorService extends ServiceBase<InventoryItemVendorEntity> {
  constructor(
    @InjectRepository(InventoryItemVendor)
    private readonly repo: Repository<InventoryItemVendor>,

    builder: InventoryItemVendorBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: InventoryItemVendorValidator,
    private readonly dataSource: DataSource,
  ) {
    super(
      repo,
      builder,
      'InventoryItemVendorService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateInventoryItemVendorDto,
  ): Promise<InventoryItemVendor> {
    return this.dataSource.transaction(async (manager) => {
      const result = manager.create(InventoryItemVendor, {
        vendorName: dto.vendorName,
      });
      await manager.save(result);
      return result;
    });
  }

  protected async updateEntity(
    entity: InventoryItemVendor,
    dto: UpdateInventoryItemVendorDto,
  ): Promise<InventoryItemVendor> {
    return this.dataSource.transaction(async (manager) => {
      if (dto.vendorName) {
        entity.vendorName = dto.vendorName;
      }

      await manager.save(entity);
      return entity;
    });
  }

  async findOneByName(
    name: string,
    relations?: Array<keyof InventoryItemVendor>,
  ): Promise<InventoryItemVendor | null> {
    return await this.repo.findOne({ where: { vendorName: name }, relations });
  }

  protected applySortBy(
    query: SelectQueryBuilder<InventoryItemVendor>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'vendorName') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }
}
