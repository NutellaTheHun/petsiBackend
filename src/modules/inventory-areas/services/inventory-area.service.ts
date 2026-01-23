import { forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
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

  protected async createEntity(
    dto: CreateInventoryAreaDto,
    manager: EntityManager,
  ): Promise<InventoryArea> {
    const result = manager.create(InventoryArea, {
      name: dto.name,
    });
    return await manager.save(result);
  }
  protected async updateEntity(
    dto: CreateInventoryAreaDto,
    manager: EntityManager,
    entity: InventoryArea,
  ): Promise<void> {
    if (dto.name !== undefined) {
      entity.name = dto.name;
    }
    await manager.save(entity);
  }

  async findOneByName(
    name: string,
    relations?: Array<keyof InventoryArea>,
  ): Promise<InventoryArea | null> {
    return await this.repo.findOne({ where: { name: name }, relations });
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
}
