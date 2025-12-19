import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemCategoryDto } from '../dto/inventory-item-category/create-inventory-item-category.dto';
import { UpdateInventoryItemCategoryDto } from '../dto/inventory-item-category/update-inventory-item-category.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { InventoryItemService } from '../services/inventory-item.service';

@Injectable()
export class InventoryItemCategoryBuilder extends BuilderBase<InventoryItemCategory> {
  constructor(
    @Inject(forwardRef(() => InventoryItemService))
    private readonly itemService: InventoryItemService,

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
    return this.setPropByVal('categoryName', name);
  }

  public categoryItemsById(ids: number[]): this {
    return this.setPropsByIds(
      this.itemService.findEntitiesById.bind(this.itemService),
      'categoryItems',
      ids,
    );
  }
}
