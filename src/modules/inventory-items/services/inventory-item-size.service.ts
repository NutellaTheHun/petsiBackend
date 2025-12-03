import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { InventoryItemSizeBuilder } from '../builders/inventory-item-size.builder';
import { CreateInventoryItemSizeDto } from '../dto/inventory-item-size/create-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../dto/inventory-item-size/update-inventory-item-size.dto';
import {
  InventoryItemSize,
  InventoryItemSizeEntity,
} from '../entities/inventory-item-size.entity';
import { InventoryItemSizeCreateInTransaction } from '../utils/transactions/inventory-item-size.create.transaction';
import { InventoryItemSizeUpdateInTransaction } from '../utils/transactions/inventory-item-size.update.transaction';
import { InventoryItemSizeValidator } from '../validators/inventory-item-size.validator';

@Injectable()
export class InventoryItemSizeService extends ServiceBase<InventoryItemSizeEntity> {
  constructor(
    @InjectRepository(InventoryItemSize)
    private readonly reop: Repository<InventoryItemSize>,

    @Inject(forwardRef(() => InventoryItemSizeBuilder))
    builder: InventoryItemSizeBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,

    @Inject(forwardRef(() => InventoryItemSizeValidator))
    validator: InventoryItemSizeValidator,
    private readonly dataSource: DataSource,
  ) {
    super(
      reop,
      builder,
      'InventoryItemSizeService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateInventoryItemSizeDto,
  ): Promise<InventoryItemSize> {
    return this.dataSource.transaction(async (manager) => {
      const result = await InventoryItemSizeCreateInTransaction(manager, dto);
      return result;
    });
  }

  protected async updateEntity(
    entity: InventoryItemSize,
    dto: UpdateInventoryItemSizeDto,
  ): Promise<InventoryItemSize> {
    return this.dataSource.transaction(async (manager) => {
      const result = await InventoryItemSizeUpdateInTransaction(
        manager,
        entity,
        dto,
      );
      return result;
    });
  }

  async findSizesByItemName(
    name: string,
    relations?: Array<keyof InventoryItemSize>,
  ): Promise<InventoryItemSize[] | null> {
    return await this.reop.find({
      where: { inventoryItem: { itemName: name } },
      relations,
    });
  }

  protected applySortBy(
    query: SelectQueryBuilder<InventoryItemSize>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'cost') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }
}
