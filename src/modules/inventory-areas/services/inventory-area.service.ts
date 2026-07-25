import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ChangeDetectorBase } from '../../../common/base/change-detector.base';
import { LocationScopedServiceBase } from '../../../common/base/location-scoped-service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryAreaDto } from '../dto/inventory-area/create-inventory-area.dto';
import { UpdateInventoryAreaDto } from '../dto/inventory-area/update-inventory-area.dto';
import {
  InventoryArea,
  InventoryAreaEntity,
} from '../entities/inventory-area.entity';
import { InventoryAreaChangeDetector } from '../utils/change-detectors/inventory-area.change-detector';
import { InventoryAreaValidator } from '../validators/inventory-area.validator';

@Injectable()
export class InventoryAreaService extends LocationScopedServiceBase<InventoryAreaEntity> {
  constructor(
    @InjectRepository(InventoryArea)
    repo: Repository<InventoryArea>,

    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: InventoryAreaValidator,
    private readonly inventoryAreaChangeDetector: InventoryAreaChangeDetector,
  ) {
    super(
      repo,
      'InventoryAreaService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateInventoryAreaDto,
    manager: EntityManager,
  ): Promise<InventoryArea> {
    const result = manager.create(InventoryArea, {
      name: dto.name,
      tenantId: this.getTenantId(),
      locationId: dto.locationId,
    });
    return await manager.save(result);
  }
  protected async updateEntity(
    dto: UpdateInventoryAreaDto,
    manager: EntityManager,
    entity: InventoryArea,
  ): Promise<void> {
    if (dto.name !== undefined) {
      entity.name = dto.name;
    }
    if (dto.locationId !== undefined) {
      entity.locationId = dto.locationId;
    }
    await manager.save(entity);
  }

  protected applySortBy(
    query: SelectQueryBuilder<InventoryArea>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'name') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }

  protected getChangeDetector():
    | ChangeDetectorBase<InventoryArea, UpdateInventoryAreaDto>
    | undefined {
    return this.inventoryAreaChangeDetector;
  }
}
