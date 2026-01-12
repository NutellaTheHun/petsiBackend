import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
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
    manager: EntityManager,
  ): Promise<InventoryItemPackage> {
    const result = manager.create(InventoryItemPackage, {
      name: dto.name,
    });
    return await manager.save(result);
  }
  protected async updateEntity(
    dto: UpdateInventoryItemPackageDto,
    manager: EntityManager,
    entity: InventoryItemPackage,
  ): Promise<void> {
    if (dto.name !== undefined) {
      entity.name = dto.name;
    }
    await manager.save(entity);
  }

  async findOneByName(
    name: string,
    relations?: Array<keyof InventoryItemPackage>,
  ): Promise<InventoryItemPackage | null> {
    return await this.repo.findOne({ where: { name: name }, relations });
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
