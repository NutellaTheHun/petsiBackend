import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemVendorDto } from '../dto/inventory-item-vendor/create-inventory-item-vendor.dto';
import { UpdateInventoryItemVendorDto } from '../dto/inventory-item-vendor/update-inventory-item-vendor.dto';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { InventoryItemService } from '../services/inventory-item.service';

@Injectable()
export class InventoryItemVendorBuilder extends BuilderBase<InventoryItemVendor> {
  constructor(
    @Inject(forwardRef(() => InventoryItemService))
    private readonly itemService: InventoryItemService,

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      InventoryItemVendor,
      'InventoryItemVendorBuilder',
      requestContextService,
      logger,
    );
  }

  protected createEntity(dto: CreateInventoryItemVendorDto): void {
    if (dto.name !== undefined) {
      this.name(dto.name);
    }
  }

  protected updateEntity(dto: UpdateInventoryItemVendorDto): void {
    if (dto.name !== undefined) {
      this.name(dto.name);
    }
  }

  public name(name: string): this {
    return this.setPropByVal('name', name);
  }

  public vendorItemsByIds(ids: number[]): this {
    return this.setPropsByIds(
      this.itemService.findEntitiesById.bind(this.itemService),
      'inventoryItems',
      ids,
    );
  }
}
