import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
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

    //builder: InventoryItemVendorBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: InventoryItemVendorValidator,
  ) {
    super(
      repo,
      //builder,
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

  async findOneByName(
    name: string,
    relations?: Array<keyof InventoryItemVendor>,
  ): Promise<InventoryItemVendor | null> {
    return await this.repo.findOne({ where: { name: name }, relations });
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
}
