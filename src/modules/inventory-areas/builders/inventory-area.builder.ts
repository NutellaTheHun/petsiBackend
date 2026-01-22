import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryAreaDto } from '../dto/inventory-area/create-inventory-area.dto';
import { UpdateInventoryAreaDto } from '../dto/inventory-area/update-inventory-area.dto';
import { InventoryArea } from '../entities/inventory-area.entity';
import { InventoryAreaCountService } from '../services/inventory-area-count.service';

@Injectable()
export class InventoryAreaBuilder extends BuilderBase<InventoryArea> {
  constructor(
    @Inject(forwardRef(() => InventoryAreaCountService))
    private readonly countService: InventoryAreaCountService,
    logger: AppLogger,

    requestContextService: RequestContextService,
  ) {
    super(InventoryArea, 'InventoryAreaBuilder', requestContextService, logger);
  }

  protected createEntity(dto: CreateInventoryAreaDto): void {
    if (dto.name !== undefined) {
      this.areaName(dto.name);
    }
  }

  protected updateEntity(dto: UpdateInventoryAreaDto): void {
    if (dto.name !== undefined) {
      this.areaName(dto.name);
    }
  }

  public areaName(name: string): this {
    return this.setPropByVal('name', name);
  }

  public inventoryCountsById(ids: number[]): this {
    return this.setPropsByIds(
      this.countService.findEntitiesById.bind(this.countService),
      'inventoryCounts',
      ids,
    );
  }
}
