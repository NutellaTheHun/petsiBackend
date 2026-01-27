import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryAreaCountDto } from '../dto/inventory-area-count/create-inventory-area-count.dto';
import { UpdateInventoryAreaCountDto } from '../dto/inventory-area-count/update-inventory-area-count.dto';
import { CreateInventoryAreaItemDto } from '../dto/inventory-area-item/create-inventory-area-item.dto';
import { NestedCreateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-create-inventory-area-item.dto';
import { NestedUpdateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-update-inventory-area-item.dto';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryAreaItem } from '../entities/inventory-area-item.entity';
import { InventoryArea } from '../entities/inventory-area.entity';
import { InventoryAreaItemBuilder } from './inventory-area-item.builder';

@Injectable()
export class InventoryAreaCountBuilder extends BuilderBase<InventoryAreaCount> {
  constructor(
    @InjectRepository(InventoryArea)
    private readonly areaRepo: Repository<InventoryArea>,

    @InjectRepository(InventoryAreaItem)
    private readonly areaItemRepo: Repository<InventoryAreaItem>,

    @Inject(forwardRef(() => InventoryAreaItemBuilder))
    private readonly itemCountBuilder: InventoryAreaItemBuilder,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(
      InventoryAreaCount,
      'InventoryAreaCountBuilder',
      requestContextService,
      logger,
    );
  }

  protected createEntity(dto: CreateInventoryAreaCountDto): void {
    if (dto.inventoryAreaId !== undefined) {
      this.inventoryAreaById(dto.inventoryAreaId);
    }
    if (dto.countedInventoryItems !== undefined) {
      this.countedItemsByBuilder(dto.countedInventoryItems);
    }
  }

  protected updateEntity(dto: UpdateInventoryAreaCountDto): void {
    if (dto.inventoryAreaId !== undefined) {
      this.inventoryAreaById(dto.inventoryAreaId);
    }
    if (dto.countedInventoryItems !== undefined) {
      this.countedItemsByBuilder(dto.countedInventoryItems);
    }
  }

  public inventoryAreaById(id: number): this {
    return this.setPropById(
      async (id: number) => await this.areaRepo.findOne({ where: { id } }),
      'inventoryArea',
      id,
    );
  }

  public inventoryAreaByName(name: string): this {
    return this.setPropByName(
      async (name: string) => await this.areaRepo.findOne({ where: { name } }),
      'inventoryArea',
      name,
    );
  }

  public countedItemsById(ids: number[]): this {
    return this.setPropsByIds(
      async (ids: number[]) =>
        await this.areaItemRepo.find({ where: { id: In(ids) } }),
      'countedInventoryItems',
      ids,
    );
  }

  public countedItemsByBuilder(
    dtos: (
      | CreateInventoryAreaItemDto
      | NestedCreateInventoryAreaItemDto
      | NestedUpdateInventoryAreaItemDto
    )[],
  ): this {
    return this.setPropByBuilder(
      this.itemCountBuilder.buildMany.bind(this.itemCountBuilder),
      'countedInventoryItems',
      this.entity,
      dtos,
    );
  }
}
