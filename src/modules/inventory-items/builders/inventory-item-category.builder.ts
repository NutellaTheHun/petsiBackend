import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemCategoryDto } from '../dto/inventory-item-category/create-inventory-item-category.dto';
import { UpdateInventoryItemCategoryDto } from '../dto/inventory-item-category/update-inventory-item-category.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { InventoryItem } from '../entities/inventory-item.entity';

@Injectable()
export class InventoryItemCategoryBuilder extends BuilderBase<InventoryItemCategory> {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly itemRepo: Repository<InventoryItem>,

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      InventoryItemCategory,
      'InventoryItemCategoryBuilder',
      requestContextService,
      logger,
    );
  }

  protected createEntity(dto: CreateInventoryItemCategoryDto): void {
    if (dto.name !== undefined) {
      this.categoryName(dto.name);
    }
  }

  protected updateEntity(dto: UpdateInventoryItemCategoryDto): void {
    if (dto.name !== undefined) {
      this.categoryName(dto.name);
    }
  }

  public categoryName(name: string): this {
    return this.setPropByVal('name', name);
  }

  public categoryItemsById(ids: number[]): this {
    return this.setPropsByIds(
      async (ids: number[]) =>
        await this.itemRepo.find({ where: { id: In(ids) } }),
      'inventoryItems',
      ids,
    );
  }
}
