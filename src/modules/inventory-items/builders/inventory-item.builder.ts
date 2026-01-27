import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemSizeDto } from '../dto/inventory-item-size/create-inventory-item-size.dto';
import { NestedCreateInventoryItemSizeDto } from '../dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { NestedUpdateInventoryItemSizeDto } from '../dto/inventory-item-size/nested-update-inventory-item-size.dto';
import { CreateInventoryItemDto } from '../dto/inventory-item/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/inventory-item/update-inventory-item.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryItemSizeBuilder } from './inventory-item-size.builder';

@Injectable()
export class InventoryItemBuilder extends BuilderBase<InventoryItem> {
  constructor(
    @InjectRepository(InventoryItemCategory)
    private readonly categoryRepo: Repository<InventoryItemCategory>,

    @InjectRepository(InventoryItemSize)
    private readonly sizeRepo: Repository<InventoryItemSize>,

    @InjectRepository(InventoryItemVendor)
    private readonly vendorRepo: Repository<InventoryItemVendor>,

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
      async (ids: number[]) =>
        await this.sizeRepo.find({ where: { id: In(ids) } }),
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
      async (id: number) => await this.categoryRepo.findOne({ where: { id } }),
      'category',
      id,
    );
  }

  public categoryByName(name: string): this {
    return this.setPropByName(
      async (name: string) =>
        await this.categoryRepo.findOne({ where: { name } }),
      'category',
      name,
    );
  }

  public vendorById(id: number | null): this {
    if (id === null) {
      return this.setPropByVal('vendor', null);
    }
    return this.setPropById(
      async (id: number) => await this.vendorRepo.findOne({ where: { id } }),
      'vendor',
      id,
    );
  }

  public vendorByName(name: string): this {
    return this.setPropByName(
      async (name: string) =>
        await this.vendorRepo.findOne({ where: { name } }),
      'vendor',
      name,
    );
  }
}
