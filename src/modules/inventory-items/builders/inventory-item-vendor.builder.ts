import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../base/builder-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemVendorDto } from '../dto/inventory-item-vendor/create-inventory-item-vendor.dto';
import { UpdateInventoryItemVendorDto } from '../dto/inventory-item-vendor/update-inventory-item-vendor.dto';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { InventoryItemService } from '../services/inventory-item.service';
import { InventoryItemVendorValidator } from '../validators/inventory-item-vendor.validator';

@Injectable()
export class InventoryItemVendorBuilder extends BuilderBase<InventoryItemVendor> {
  constructor(
    @Inject(forwardRef(() => InventoryItemService))
    private readonly itemService: InventoryItemService,

    validator: InventoryItemVendorValidator,
    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      InventoryItemVendor,
      'InventoryItemVendorBuilder',
      requestContextService,
      logger,
      validator,
    );
  }

  protected createEntity(dto: CreateInventoryItemVendorDto): void {
    if (dto.vendorName !== undefined) {
      this.name(dto.vendorName);
    }
  }

  protected updateEntity(dto: UpdateInventoryItemVendorDto): void {
    if (dto.vendorName !== undefined) {
      this.name(dto.vendorName);
    }
  }

  public name(name: string): this {
    return this.setPropByVal('vendorName', name);
  }

  public vendorItemsByIds(ids: number[]): this {
    return this.setPropsByIds(
      this.itemService.findEntitiesById.bind(this.itemService),
      'vendorItems',
      ids,
    );
  }
}
