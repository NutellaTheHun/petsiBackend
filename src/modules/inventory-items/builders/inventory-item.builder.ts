import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemSizeDto } from '../dto/inventory-item-size/create-inventory-item-size.dto';
import { NestedCreateInventoryItemSizeDto } from '../dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { NestedUpdateInventoryItemSizeDto } from '../dto/inventory-item-size/nested-update-inventory-item-size.dto';
import { CreateInventoryItemDto } from '../dto/inventory-item/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/inventory-item/update-inventory-item.dto';
import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryItemCategoryService } from '../services/inventory-item-category.service';
import { InventoryItemSizeService } from '../services/inventory-item-size.service';
import { InventoryItemVendorService } from '../services/inventory-item-vendor.service';
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

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(InventoryItem, 'InventoryItemBuilder', requestContextService, logger);
  }

  protected createEntity(dto: CreateInventoryItemDto): void {
    if (dto.categoryId !== undefined) {
      this.categoryById(dto.categoryId);
    }
    if (dto.name !== undefined) {
      this.name(dto.name);
    }
    if (dto.sizes !== undefined) {
      this.sizesByBuilder(dto.sizes);
    }
    if (dto.vendorId !== undefined) {
      this.vendorById(dto.vendorId);
    }
  }

  protected updateEntity(dto: UpdateInventoryItemDto): void {
    if (dto.categoryId !== undefined) {
      this.categoryById(dto.categoryId);
    }
    if (dto.name !== undefined) {
      this.name(dto.name);
    }
    if (dto.sizes !== undefined) {
      this.sizesByBuilder(dto.sizes);
    }
    if (dto.vendorId !== undefined) {
      this.vendorById(dto.vendorId);
    }
  }

  public name(name: string): this {
    return this.setPropByVal('name', name);
  }

  public sizesByIds(ids: number[]): this {
    return this.setPropsByIds(
      this.sizeService.findEntitiesById.bind(this.sizeService),
      'sizes',
      ids,
    );
  }

  public sizesByBuilder(
    dtos: (
      | CreateInventoryItemSizeDto
      | NestedCreateInventoryItemSizeDto
      | NestedUpdateInventoryItemSizeDto
    )[],
  ): this {
    return this.setPropByBuilder(
      this.itemSizeBuilder.buildMany.bind(this.itemSizeBuilder),
      'sizes',
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
