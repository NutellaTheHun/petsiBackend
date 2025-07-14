import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../base/builder-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemSizeDto } from '../dto/inventory-item-size/create-inventory-item-size.dto';
import { NestedInventoryItemSizeDto } from '../dto/inventory-item-size/nested-inventory-item-size.dto';
import { CreateInventoryItemDto } from '../dto/inventory-item/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/inventory-item/update-inventory-item.dto';
import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryItemCategoryService } from '../services/inventory-item-category.service';
import { InventoryItemSizeService } from '../services/inventory-item-size.service';
import { InventoryItemVendorService } from '../services/inventory-item-vendor.service';
import { InventoryItemValidator } from '../validators/inventory-item.validator';
import { InventoryItemSizeBuilder } from './inventory-item-size.builder';

@Injectable()
export class InventoryItemBuilder extends BuilderBase<InventoryItem> {
  constructor(
    @Inject(forwardRef(() => InventoryItemCategoryService))
    private readonly categoryService: InventoryItemCategoryService,

    @Inject(forwardRef(() => InventoryItemSizeService))
    private readonly sizeService: InventoryItemSizeService,

    @Inject(forwardRef(() => InventoryItemVendorService))
    private readonly vendorService: InventoryItemVendorService,

    @Inject(forwardRef(() => InventoryItemSizeBuilder))
    private readonly itemSizeBuilder: InventoryItemSizeBuilder,

    validator: InventoryItemValidator,
    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      InventoryItem,
      'InventoryItemBuilder',
      requestContextService,
      logger,
      validator,
    );
  }

  protected createEntity(dto: CreateInventoryItemDto): void {
    if (dto.inventoryItemCategoryId !== undefined) {
      this.categoryById(dto.inventoryItemCategoryId);
    }
    if (dto.itemName !== undefined) {
      this.name(dto.itemName);
    }
    if (dto.itemSizeDtos !== undefined) {
      this.sizesByBuilder(dto.itemSizeDtos);
    }
    if (dto.vendorId !== undefined) {
      this.vendorById(dto.vendorId);
    }
  }

  protected updateEntity(dto: UpdateInventoryItemDto): void {
    if (dto.inventoryItemCategoryId !== undefined) {
      this.categoryById(dto.inventoryItemCategoryId);
    }
    if (dto.itemName !== undefined) {
      this.name(dto.itemName);
    }
    if (dto.itemSizeDtos !== undefined) {
      this.sizesByBuilder(dto.itemSizeDtos);
    }
    if (dto.vendorId !== undefined) {
      this.vendorById(dto.vendorId);
    }
  }

  public name(name: string): this {
    return this.setPropByVal('itemName', name);
  }

  public sizesByIds(ids: number[]): this {
    return this.setPropsByIds(
      this.sizeService.findEntitiesById.bind(this.sizeService),
      'itemSizes',
      ids,
    );
  }

  public sizesByBuilder(
    dtos: CreateInventoryItemSizeDto[] | NestedInventoryItemSizeDto[],
  ): this {
    return this.setPropByBuilder(
      this.itemSizeBuilder.buildMany.bind(this.itemSizeBuilder),
      'itemSizes',
      this.entity,
      dtos,
    );
  }

  public categoryById(id: number | null): this {
    if (id === null) {
      return this.setPropByVal('category', null);
    }
    return this.setPropById(
      this.categoryService.findOne.bind(this.categoryService),
      'category',
      id,
    );
  }

  public categoryByName(name: string): this {
    return this.setPropByName(
      this.categoryService.findOneByName.bind(this.categoryService),
      'category',
      name,
    );
  }

  public vendorById(id: number | null): this {
    if (id === null) {
      return this.setPropByVal('vendor', null);
    }
    return this.setPropById(
      this.vendorService.findOne.bind(this.vendorService),
      'vendor',
      id,
    );
  }

  public vendorByName(name: string): this {
    return this.setPropByName(
      this.vendorService.findOneByName.bind(this.vendorService),
      'vendor',
      name,
    );
  }
}
