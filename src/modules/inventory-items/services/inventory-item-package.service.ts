import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { InventoryItemPackageBuilder } from '../builders/inventory-item-package.builder';
import { CreateInventoryItemPackageDto } from '../dto/inventory-item-package/create-inventory-item-package.dto';
import { UpdateInventoryItemPackageDto } from '../dto/inventory-item-package/update-inventory-item-package.dto';
import {
  InventoryItemPackage,
  InventoryItemPackageEntity,
} from '../entities/inventory-item-package.entity';
import { InventoryItemPackageValidator } from '../validators/inventory-item-package.validator';

@Injectable()
export class InventoryItemPackageService extends ServiceBase<InventoryItemPackageEntity> {
  constructor(
    @InjectRepository(InventoryItemPackage)
    private readonly repo: Repository<InventoryItemPackage>,

    builder: InventoryItemPackageBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: InventoryItemPackageValidator,
    private readonly dataSource: DataSource,
  ) {
    super(
      repo,
      builder,
      'InventoryItemPackageService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateInventoryItemPackageDto,
  ): Promise<InventoryItemPackage> {
    return this.dataSource.transaction(async (manager) => {
      const result = manager.create(InventoryItemPackage, {
        packageName: dto.packageName,
      });
      await manager.save(result);
      return result;
    });
  }
  protected async updateEntity(
    entity: InventoryItemPackage,
    dto: UpdateInventoryItemPackageDto,
  ): Promise<InventoryItemPackage> {
    return this.dataSource.transaction(async (manager) => {
      if (dto.packageName) {
        entity.packageName = dto.packageName;
      }
      await manager.save(entity);
      return entity;
    });
  }

  async findOneByName(
    name: string,
    relations?: Array<keyof InventoryItemPackage>,
  ): Promise<InventoryItemPackage | null> {
    return await this.repo.findOne({ where: { packageName: name }, relations });
  }

  protected applySortBy(
    query: SelectQueryBuilder<InventoryItemPackage>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'packageName') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }
}
