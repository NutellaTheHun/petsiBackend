import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../base/builder-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryAreaCountDto } from '../dto/inventory-area-count/create-inventory-area-count.dto';
import {
  NestedUpdateInventoryAreaItemDto,
  UpdateInventoryAreaCountDto,
} from '../dto/inventory-area-count/update-inventory-area-count.dto';
import { CreateInventoryAreaItemDto } from '../dto/inventory-area-item/create-inventory-area-item.dto';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryAreaItemService } from '../services/inventory-area-item.service';
import { InventoryAreaService } from '../services/inventory-area.service';
import { InventoryAreaCountValidator } from '../validators/inventory-area-count.validator';
import { InventoryAreaItemBuilder } from './inventory-area-item.builder';

@Injectable()
export class InventoryAreaCountBuilder extends BuilderBase<InventoryAreaCount> {
  constructor(
    @Inject(forwardRef(() => InventoryAreaService))
    private readonly areaService: InventoryAreaService,

    @Inject(forwardRef(() => InventoryAreaItemService))
    private readonly areaItemService: InventoryAreaItemService,

    @Inject(forwardRef(() => InventoryAreaItemBuilder))
    private readonly itemCountBuilder: InventoryAreaItemBuilder,

    logger: AppLogger,
    validator: InventoryAreaCountValidator,
    requestContextService: RequestContextService,
  ) {
    super(
      InventoryAreaCount,
      'InventoryAreaCountBuilder',
      requestContextService,
      logger,
      validator,
    );
  }

  protected createEntity(dto: CreateInventoryAreaCountDto): void {
    if (dto.inventoryAreaId !== undefined) {
      this.inventoryAreaById(dto.inventoryAreaId);
    }
    if (dto.itemCountDtos !== undefined) {
      this.countedItemsByBuilder(this.entity, dto.itemCountDtos);
    }
  }

  protected updateEntity(dto: UpdateInventoryAreaCountDto): void {
    if (dto.inventoryAreaId !== undefined) {
      this.inventoryAreaById(dto.inventoryAreaId);
    }
    if (dto.itemCountDtos !== undefined) {
      this.countedItemsByBuilder(this.entity, dto.itemCountDtos);
    }
  }

  public inventoryAreaById(id: number): this {
    return this.setPropById(
      this.areaService.findOne.bind(this.areaService),
      'inventoryArea',
      id,
    );
  }

  public inventoryAreaByName(name: string): this {
    return this.setPropByName(
      this.areaService.findOneByName.bind(this.areaService),
      'inventoryArea',
      name,
    );
  }

  public countedItemsById(ids: number[]): this {
    return this.setPropsByIds(
      this.areaItemService.findEntitiesById.bind(this.areaItemService),
      'countedItems',
      ids,
    );
  }

  public countedItemsByBuilder(
    parent: InventoryAreaCount,
    dtos: (CreateInventoryAreaItemDto | NestedUpdateInventoryAreaItemDto)[],
  ): this {
    if (dtos instanceof CreateInventoryAreaItemDto) {
      return this.setPropByBuilder(
        this.itemCountBuilder.createMany.bind(this.itemCountBuilder),
        'countedItems',
        parent,
        dtos,
      );
    }

    return this.setPropByBuilder(
      this.itemCountBuilder.updateMany.bind(this.itemCountBuilder),
      'countedItems',
      parent,
      dtos,
    );
  }
}
