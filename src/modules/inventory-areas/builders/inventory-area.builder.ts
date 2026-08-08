import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryAreaDto } from '../dto/inventory-area/create-inventory-area.dto';
import { UpdateInventoryAreaDto } from '../dto/inventory-area/update-inventory-area.dto';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryArea } from '../entities/inventory-area.entity';

@Injectable()
export class InventoryAreaBuilder extends BuilderBase<InventoryArea> {
  constructor(
    @InjectRepository(InventoryAreaCount)
    private readonly countRepo: Repository<InventoryAreaCount>,
    logger: AppLogger,

    requestContextService: RequestContextService,
  ) {
    super(InventoryArea, 'InventoryAreaBuilder', requestContextService, logger);
  }

  protected createEntity(dto: CreateInventoryAreaDto): void {
    if (dto.name !== undefined) {
      this.areaName(dto.name);
    }
    if (dto.locationId !== undefined) {
      this.locationId(dto.locationId);
    }
  }

  protected updateEntity(dto: UpdateInventoryAreaDto): void {
    if (dto.name !== undefined) {
      this.areaName(dto.name);
    }
    if (dto.locationId !== undefined) {
      this.locationId(dto.locationId);
    }
  }

  public areaName(name: string): this {
    return this.setPropByVal('name', name);
  }

  public tenantId(tenantId: number): this {
    return this.setPropByVal('tenantId', tenantId);
  }

  public locationId(locationId: number): this {
    return this.setPropByVal('locationId', locationId);
  }

  public inventoryCountsById(ids: number[]): this {
    return this.setPropsByIds(
      async (ids: number[]) =>
        await this.countRepo.find({ where: { id: In(ids) } }),
      'inventoryCounts',
      ids,
    );
  }
}
