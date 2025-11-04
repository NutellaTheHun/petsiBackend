import { forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { InventoryAreaBuilder } from '../builders/inventory-area.builder';
import { CreateInventoryAreaDto } from '../dto/inventory-area/create-inventory-area.dto';
import {
  InventoryArea,
  InventoryAreaEntity,
} from '../entities/inventory-area.entity';
import { InventoryAreaValidator } from '../validators/inventory-area.validator';

export class InventoryAreaService extends ServiceBase<InventoryAreaEntity> {
  protected createEntity(dto: CreateInventoryAreaDto): InventoryArea {
    // No Children
    // Validate
    // Build
    // Return
    throw new Error('Method not implemented.');
  }
  protected updateEntity(
    entity: InventoryArea,
    dto: CreateInventoryAreaDto,
  ): InventoryArea {
    // No Children
    // Validate
    // Build
    // Return
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(InventoryArea)
    private readonly repo: Repository<InventoryArea>,

    @Inject(forwardRef(() => InventoryAreaBuilder))
    builder: InventoryAreaBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: InventoryAreaValidator,
  ) {
    super(
      repo,
      builder,
      'InventoryAreaService',
      requestContextService,
      logger,
      validator,
    );
  }

  async findOneByName(
    name: string,
    relations?: Array<keyof InventoryArea>,
  ): Promise<InventoryArea | null> {
    return await this.repo.findOne({ where: { areaName: name }, relations });
  }

  protected applySortBy(
    query: SelectQueryBuilder<InventoryArea>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'areaName') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }
}
